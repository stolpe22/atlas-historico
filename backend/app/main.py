from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from geoalchemy2.shape import to_shape
from shapely.geometry import mapping
from pydantic import BaseModel
from typing import List, Optional
from . import models, database, populate_final, deduplicate_smart

app = FastAPI(title="Atlas Histórico API")

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
    period: str = None # <--- NOVO CAMPO

# ESTADO GLOBAL
population_state = {
    "is_running": False,
    "message": "Aguardando início...",
}

def update_population_status(message: str):
    population_state["message"] = message
    print(f"STATUS: {message}")

# --- TAREFA PESADA (BACKGROUND) ---
def run_population_logic():
    # Não precisa setar is_running=True aqui, pois já setamos na rota.
    try:
        populate_final.populate_manual(status_callback=update_population_status)
        
        update_population_status("🧹 Verificando duplicatas finais...")
        deduplicate_smart.deduplicate_fuzzy()
        
        population_state["message"] = "✅ Concluído com sucesso!"
    except Exception as e:
        print(f"ERRO FATAL: {e}")
        population_state["message"] = f"❌ Erro: {str(e)}"
    finally:
        # Só aqui setamos como False
        population_state["is_running"] = False

# --- ROTAS ---

@app.post("/populate")
def trigger_populate(background_tasks: BackgroundTasks):
    if population_state["is_running"]:
        return {"status": "busy", "message": "Já existe uma importação em andamento."}
    
    # --- CORREÇÃO AQUI ---
    # Marcamos como rodando IMEDIATAMENTE (Síncrono), antes de iniciar a thread.
    population_state["is_running"] = True
    population_state["message"] = "🚀 Inicializando..."
    
    background_tasks.add_task(run_population_logic)
    
    return {"status": "started", "message": "Importação iniciada."}

@app.get("/populate/status")
def get_populate_status():
    return population_state

# ... (Mantenha o resto das rotas GET/POST events igual estava) ...
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

# --- Validação de Duplicidade ---
def check_if_exists(db: Session, name: str, year: int):
    return db.query(models.HistoricalEvent).filter(
        models.HistoricalEvent.name.ilike(name),
        models.HistoricalEvent.year_start == year
    ).first()

# --- Rota POST Individual (Atualizada) ---
@app.post("/events")
def create_event(event: EventCreate, db: Session = Depends(database.get_db)):
    # Verifica duplicidade
    existing = db.query(models.HistoricalEvent).filter(
        models.HistoricalEvent.name.ilike(event.name),
        models.HistoricalEvent.year_start == event.year_start
    ).first()
    
    if existing:
        return {"status": "skipped", "message": "Event already exists", "id": existing.id}

    wkt_location = f"SRID=4326;POINT({event.longitude} {event.latitude})"
    
    db_event = models.HistoricalEvent(
        name=event.name,
        description=event.description,
        year_start=event.year_start,
        year_end=event.year_end,
        continent=event.continent,
        period=event.period, # <--- GRAVA NO BANCO
        location=wkt_location
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return {"status": "created", "name": db_event.name, "id": db_event.id}

# --- Rota POST Import (Atualizada) ---
@app.post("/events/import")
def import_bulk_events(events: List[EventCreate], db: Session = Depends(database.get_db)):
    imported_count = 0
    skipped_count = 0
    for event in events:
        try:
            # Verifica duplicidade
            exists = db.query(models.HistoricalEvent).filter(
                models.HistoricalEvent.name.ilike(event.name),
                models.HistoricalEvent.year_start == event.year_start
            ).first()
            
            if exists:
                skipped_count += 1
                continue

            wkt_location = f"SRID=4326;POINT({event.longitude} {event.latitude})"
            db_event = models.HistoricalEvent(
                name=event.name,
                description=event.description,
                year_start=event.year_start,
                year_end=event.year_end,
                continent=event.continent,
                period=event.period, # <--- GRAVA NO BANCO
                location=wkt_location
            )
            db.add(db_event)
            imported_count += 1
        except Exception as e:
            print(f"Erro no import: {e}")
            continue
            
    db.commit()
    return {"status": "success", "imported_count": imported_count, "skipped_count": skipped_count}

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
            "continent": event.continent,
            "period": event.period # <--- RETORNA PRO FRONT
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