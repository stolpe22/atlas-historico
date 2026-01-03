from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from geoalchemy2.shape import to_shape
from shapely.geometry import mapping
from pydantic import BaseModel
from typing import List, Optional
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
    content: Optional[str] = None
    year_start: int
    year_end: Optional[int] = None
    latitude: float
    longitude: float
    continent: Optional[str] = None
    period: Optional[str] = None

# --- LÓGICA DE NEGÓCIO (Reutilizável) ---
def calculate_period(year: int) -> str:
    """Calcula o período histórico automaticamente baseado no ano."""
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

def run_population_logic(mode: str):
    print(f"--- INICIANDO POPULAÇÃO ({mode}) ---")
    try:
        if mode == "fast":
            update_population_status("⚡ Iniciando Modo Turbo...")
            populate_final.run_fast_mode(status_callback=update_population_status)
        else:
            update_population_status("🔍 Iniciando Varredura Detalhada...")
            populate_final.run_detailed_mode(status_callback=update_population_status)
        
        update_population_status("🧹 Removendo duplicatas...")
        deduplicate_smart.deduplicate_fuzzy()
        population_state["message"] = "✅ Concluído!"
    except Exception as e:
        print(f"ERRO: {e}")
        population_state["message"] = f"Erro: {str(e)}"
    finally:
        population_state["is_running"] = False

# --- ROTAS ---

@app.post("/populate")
def trigger_populate(mode: str = "fast", background_tasks: BackgroundTasks = None):
    if population_state["is_running"]:
        return {"status": "busy", "message": "Já rodando."}
    population_state["is_running"] = True
    population_state["message"] = f"Iniciando {mode}..."
    background_tasks.add_task(run_population_logic, mode)
    return {"status": "started"}

@app.get("/populate/status")
def get_status(): return population_state

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
                "content": event.content, # <--- GARANTINDO QUE VAI PRO FRONT
                "year": event.year_start,
                "period": event.period,
                "continent": event.continent
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
            "is_manual": e.is_manual, # <--- Enviando para o Frontend
            "latitude": s.y, 
            "longitude": s.x
        })
    return res

@app.post("/events")
def create_event(event: EventCreate, db: Session = Depends(database.get_db)):
    # Verifica duplicidade
    exists = db.query(models.HistoricalEvent).filter(
        models.HistoricalEvent.name.ilike(event.name), 
        models.HistoricalEvent.year_start == event.year_start
    ).first()
    if exists: return {"status": "skipped", "id": exists.id}

    # LÓGICA INTELIGENTE: Se não veio período, calcula automático
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
        is_manual=True,  # <--- AQUI ESTÁ A MÁGICA: Evento Manual = True
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