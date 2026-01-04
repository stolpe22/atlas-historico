from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from geoalchemy2.shape import to_shape
from shapely.geometry import mapping
from pydantic import BaseModel
from typing import List, Optional
from . import models, database, populate_final, deduplicate_smart
from .models import EventSource

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
    content: Optional[str] = None
    year_start: int
    year_end: Optional[int] = None
    latitude: float
    longitude: float
    continent: Optional[str] = None
    period: Optional[str] = None
    source: Optional[str] = "manual"
    
class PopulateOptions(BaseModel):
    mode: str # Mantido para compatibilidade com JSON do frontend, mas ignorado na lógica
    continents: List[str]
    start_year: int
    end_year: int

# --- LÓGICA DE NEGÓCIO ---
def calculate_period(year: int) -> str:
    if year < -4000: return "Pré-História"
    if year < 476: return "Idade Antiga"
    if year < 1453: return "Idade Média"
    if year < 1789: return "Idade Moderna"
    return "Idade Contemporânea"

# --- ESTADO GLOBAL ---
population_state = {
    "is_running": False,
    "message": "Aguardando início...",
}

def update_population_status(message: str):
    population_state["message"] = message
    print(f"STATUS: {message}")

def run_population_logic(options: PopulateOptions):
    print(f"--- INICIANDO EXTRAÇÃO: {options.continents} ({options.start_year}-{options.end_year}) ---")
    try:
        update_population_status("🔍 Inicializando Varredura...")
        
        # Chama a função única agora, sem if/else
        populate_final.run_unified_logic(
            status_callback=update_population_status,
            target_continents=options.continents,
            start_year=options.start_year,
            end_year=options.end_year
        )

        update_population_status("🧹 Otimizando banco de dados...")
        deduplicate_smart.deduplicate_fuzzy()
        population_state["message"] = "✅ Concluído!"

    except Exception as e:
        print(f"ERRO: {e}")
        population_state["message"] = f"Erro: {str(e)}"
    finally:
        population_state["is_running"] = False
        
        # Nova função auxiliar para rodar SÓ o seed
def run_seed_logic():
    try:
        update_population_status("📂 Lendo arquivo de dados padrão...")
        populate_final.populate_from_json_file(status_callback=update_population_status)
        
        update_population_status("🧹 Otimizando banco de dados...")
        deduplicate_smart.deduplicate_fuzzy()
        
        population_state["message"] = "✅ Dados padrão inseridos!"
    except Exception as e:
        print(f"ERRO SEED: {e}")
        population_state["message"] = f"Erro: {str(e)}"
    finally:
        population_state["is_running"] = False

# --- ROTAS ---

@app.post("/populate/seed")
def trigger_seed(background_tasks: BackgroundTasks):
    if population_state["is_running"]:
        return {"status": "busy", "message": "Já existe um processo rodando."}

    populate_final.reset_stop_flag()
    population_state["is_running"] = True
    population_state["message"] = "Iniciando Preset..."
    
    background_tasks.add_task(run_seed_logic)
    return {"status": "started"}

@app.post("/populate")
def trigger_populate(options: PopulateOptions, background_tasks: BackgroundTasks):
    if population_state["is_running"]:
        # Se forçar o início, reseta o estado anterior
        populate_final.reset_stop_flag() 

    population_state["is_running"] = True
    population_state["message"] = "Configurando..."
    background_tasks.add_task(run_population_logic, options)
    return {"status": "started"}

@app.get("/populate/status")
def get_status(): return population_state

@app.post("/populate/stop")
def stop_populate():
    """Rota para o botão de cancelar chamar"""
    print("🛑 Rota STOP chamada!")
    populate_final.request_stop()
    population_state["message"] = "🛑 Parando... Aguarde o fim da requisição atual."
    return {"status": "Parada solicitada."}

@app.get("/events")
def get_events(start_year: int, end_year: int, continent: str = None, db: Session = Depends(database.get_db)):
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
                "content": event.content,
                "year": event.year_start,
                "period": event.period,
                "continent": event.continent,
                "source": event.source
            }
        })
    return {"type": "FeatureCollection", "features": features}

@app.get("/events/all")
def get_all(db: Session = Depends(database.get_db)):
    events = db.query(models.HistoricalEvent).order_by(models.HistoricalEvent.year_start).all()
    res = []
    for e in events:
        s = to_shape(e.location)
        res.append({
            "id": e.id, 
            "name": e.name, 
            "year_start": e.year_start, 
            "continent": e.continent, 
            "period": e.period, 
            "description": e.description, 
            "content": e.content,
            "source": e.source, 
            "latitude": s.y, 
            "longitude": s.x
        })
    return res

@app.post("/events")
def create_event(event: EventCreate, db: Session = Depends(database.get_db)):
    # 1. Verifica se já existe pelo nome e ano
    exists = db.query(models.HistoricalEvent).filter(
        models.HistoricalEvent.name.ilike(event.name), 
        models.HistoricalEvent.year_start == event.year_start
    ).first()

    # 2. SE EXISTIR: Verifica se devemos ATUALIZAR
    if exists:
        if (exists.source == "manual" or exists.source is None) and event.source in ["wikidata", "seed"]:
            exists.source = event.source
            exists.continent = event.continent 
            if event.content and len(event.content) > len(exists.content or ""):
                exists.content = event.content 
            
            db.commit()
            return {"status": "updated", "id": exists.id, "msg": "Atualizado para Wikidata"}
        
        return {"status": "skipped", "id": exists.id}

    # 3. SE NÃO EXISTIR: Cria novo
    final_period = event.period
    if not final_period:
        final_period = calculate_period(event.year_start)

    wkt = f"SRID=4326;POINT({event.longitude} {event.latitude})"
    
    db_event = models.HistoricalEvent(
        name=event.name,
        description=event.description,
        content=event.content,
        year_start=event.year_start,
        year_end=event.year_end,
        continent=event.continent,
        period=final_period,
        source=event.source, 
        location=wkt
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return {"status": "created", "name": db_event.name, "id": db_event.id}

@app.delete("/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(database.get_db)):
    e = db.query(models.HistoricalEvent).filter(models.HistoricalEvent.id == event_id).first()
    if not e: raise HTTPException(404, "Not found")
    db.delete(e)
    db.commit()
    return {"status": "deleted"}