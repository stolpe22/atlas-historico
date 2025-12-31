from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from geoalchemy2.shape import to_shape
from shapely.geometry import mapping
from pydantic import BaseModel
from typing import List
from . import models, database, populate_final, deduplicate_smart

app = FastAPI(title="Atlas Histórico API")

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=database.engine)

class EventCreate(BaseModel):
    name: str
    description: str
    year_start: int
    year_end: int = None
    latitude: float
    longitude: float
    continent: str = None

# --- Rota GET (Listagem) ---
@app.get("/events")
def get_events(
    start_year: int, 
    end_year: int, 
    continent: str = None, 
    db: Session = Depends(database.get_db)
):
    query = db.query(models.HistoricalEvent).filter(
        models.HistoricalEvent.year_start >= start_year,
        models.HistoricalEvent.year_start <= end_year
    )
    if continent and continent != "Todos":
        query = query.filter(models.HistoricalEvent.continent == continent)

    events = query.all()

    features = []
    for event in events:
        geom = to_shape(event.location)
        features.append({
            "type": "Feature",
            "geometry": mapping(geom),
            "properties": {
                "id": event.id,
                "name": event.name,
                "description": event.description,
                "year": event.year_start,
                "continent": event.continent
            }
        })
    return {"type": "FeatureCollection", "features": features}

# --- NOVA LÓGICA: Verifica Duplicidade ---
def check_if_exists(db: Session, name: str, year: int):
    # Procura por nome (case insensitive) E ano igual
    return db.query(models.HistoricalEvent).filter(
        models.HistoricalEvent.name.ilike(name), # ilike = ignora maiúscula/minúscula
        models.HistoricalEvent.year_start == year
    ).first()

# --- Rota POST Individual (Atualizada) ---
@app.post("/events")
def create_event(event: EventCreate, db: Session = Depends(database.get_db)):
    # 1. Verifica se já existe
    existing = check_if_exists(db, event.name, event.year_start)
    if existing:
        # Se existe, retorna sucesso mas avisa que não criou novo (Idempotência)
        return {"status": "skipped", "message": "Event already exists", "id": existing.id}

    # 2. Se não existe, cria
    wkt_location = f"SRID=4326;POINT({event.longitude} {event.latitude})"
    db_event = models.HistoricalEvent(
        name=event.name,
        description=event.description,
        year_start=event.year_start,
        year_end=event.year_end,
        continent=event.continent,
        location=wkt_location
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return {"status": "created", "name": db_event.name, "id": db_event.id}

# --- Rota POST Massiva (JSON Manual) - Atualizada ---
@app.post("/events/import")
def import_bulk_events(events: List[EventCreate], db: Session = Depends(database.get_db)):
    imported_count = 0
    skipped_count = 0
    
    for event in events:
        try:
            # 1. Verifica duplicidade
            if check_if_exists(db, event.name, event.year_start):
                skipped_count += 1
                continue

            wkt_location = f"SRID=4326;POINT({event.longitude} {event.latitude})"
            db_event = models.HistoricalEvent(
                name=event.name,
                description=event.description,
                year_start=event.year_start,
                year_end=event.year_end,
                continent=event.continent,
                location=wkt_location
            )
            db.add(db_event)
            imported_count += 1
        except Exception as e:
            print(f"Erro ao importar {event.name}: {e}")
            continue
            
    db.commit()
    # Retorna o resumo para o frontend
    return {
        "status": "success", 
        "imported_count": imported_count, 
        "skipped_count": skipped_count
    }

@app.get("/events/all")
def get_all_events(db: Session = Depends(database.get_db)):
    events = db.query(models.HistoricalEvent).order_by(models.HistoricalEvent.year_start).all()
    response = []
    for event in events:
        shape = to_shape(event.location)
        response.append({
            "id": event.id,
            "name": event.name,
            "year_start": event.year_start,
            "year_end": event.year_end,
            "latitude": shape.y,
            "longitude": shape.x,
            "continent": event.continent
        })
    return response

@app.delete("/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(database.get_db)):
    event = db.query(models.HistoricalEvent).filter(models.HistoricalEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db.delete(event)
    db.commit()
    return {"status": "deleted", "id": event_id}

# --- LÓGICA DE POPULAÇÃO EM BACKGROUND ---
def run_population_logic():
    print("🤖 Iniciando população segura...")
    populate_final.populate_manual() # Agora o endpoint interno já filtra duplicatas
    
    # Busca um pouco mais de dados
    populate_final.fetch_from_wikidata("Q18", "América do Sul", limit=50)
    populate_final.fetch_from_wikidata("Q49", "América do Norte", limit=50)
    populate_final.fetch_from_wikidata("Q46", "Europa", limit=50)
    
    # Roda o deduplicate só pra garantir casos extremos
    deduplicate_smart.deduplicate_fuzzy()
    print("✅ População concluída!")

@app.post("/populate")
def trigger_populate(background_tasks: BackgroundTasks):
    background_tasks.add_task(run_population_logic)
    return {"status": "População iniciada! O sistema irá ignorar eventos que já existem."}