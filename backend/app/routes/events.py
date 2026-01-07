from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel

from ..database import get_db
from ..models.events import HistoricalEvent
from ..schemas import (
    EventCreate, 
    EventResponse, 
    EventGeoCollection, 
    StatusResponse
)
from ..services.event_service import EventService

router = APIRouter(prefix="/events", tags=["events"])

# --- Schema Local para a Resposta de Detecção ---
class ContinentDetectionResponse(BaseModel):
    continent: str

@router.get("/detect-continent", response_model=ContinentDetectionResponse)
def detect_continent_route(
    lat: float, 
    lon: float, 
    db: Session = Depends(get_db)
):
    """
    Endpoint leve para descobrir o continente baseado nas coordenadas.
    Usado pelo Frontend quando o usuário clica no mapa ou digita lat/lon.
    """
    service = EventService(db)
    detected = service.detect_continent(lat, lon)
    return {"continent": detected}


@router.get("", response_model=EventGeoCollection)
def get_events(
    start_year: int = Query(..., ge=-10000, le=2100),
    end_year: int = Query(..., ge=-10000, le=2100),
    continent: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retorna eventos filtrados como GeoJSON para o Mapa."""
    service = EventService(db)
    return service.get_filtered(start_year, end_year, continent)


@router.get("/all", response_model=List[EventResponse])
def get_all_events(db: Session = Depends(get_db)):
    """Retorna todos os eventos em formato de lista (para a ListView)."""
    service = EventService(db)
    return service.get_all()


@router.post("", response_model=StatusResponse)
def create_event(event: EventCreate, db: Session = Depends(get_db)):
    """Cria novo evento (ou atualiza se existir duplicata)."""
    service = EventService(db)
    result = service.create(event)
    return StatusResponse(**result)


@router.delete("/{event_id}", response_model=StatusResponse)
def delete_event(event_id: int, db: Session = Depends(get_db)):
    """Deleta evento por ID."""
    service = EventService(db)
    deleted = service.delete(event_id)
    
    if not deleted: 
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    return StatusResponse(status="deleted", id=event_id)


@router.get("/filters")
def get_unique_filters(db: Session = Depends(get_db)):
    """
    Busca no banco todos os valores únicos existentes (Continentes, Períodos, Fontes).
    Usado para preencher os Selects do Frontend dinamicamente.
    """
    continents = db.query(HistoricalEvent.continent).distinct().all()
    periods = db.query(HistoricalEvent.period).distinct().all()
    sources = db.query(HistoricalEvent.source).distinct().all()

    return {
        "continents": sorted([c[0] for c in continents if c[0]]),
        "periods": sorted([p[0] for p in periods if p[0]]),
        "sources": sorted([s[0] for s in sources if s[0]])
    }