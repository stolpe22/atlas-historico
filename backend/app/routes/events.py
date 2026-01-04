from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..schemas import EventCreate, EventResponse, EventGeoCollection, StatusResponse
from ..services.event_service import EventService

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=EventGeoCollection)
def get_events(
    start_year: int = Query(..., ge=-10000, le=2100),
    end_year: int = Query(..., ge=-10000, le=2100),
    continent: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retorna eventos filtrados como GeoJSON."""
    service = EventService(db)
    return service.get_filtered(start_year, end_year, continent)


@router.get("/all", response_model=list[EventResponse])
def get_all_events(db: Session = Depends(get_db)):
    """Retorna todos os eventos."""
    service = EventService(db)
    return service.get_all()


@router.post("", response_model=StatusResponse)
def create_event(event: EventCreate, db: Session = Depends(get_db)):
    """Cria novo evento."""
    service = EventService(db)
    result = service.create(event)
    return StatusResponse(**result)


@router.delete("/{event_id}", response_model=StatusResponse)
def delete_event(event_id: int, db:  Session = Depends(get_db)):
    """Deleta evento por ID."""
    service = EventService(db)
    deleted = service.delete(event_id)
    
    if not deleted: 
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    return StatusResponse(status="deleted", id=event_id)