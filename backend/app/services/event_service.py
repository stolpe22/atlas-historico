from sqlalchemy.orm import Session
from sqlalchemy import and_
from geoalchemy2.shape import to_shape
from shapely.geometry import mapping
from typing import List, Optional

from ..models import HistoricalEvent, EventSource
from ..schemas import EventCreate, EventResponse, EventGeoCollection, EventGeoFeature
from ..utils.helpers import calculate_period


class EventService: 
    """Serviço para gerenciamento de eventos históricos."""

    def __init__(self, db: Session):
        self.db = db

    def get_all(self) -> List[EventResponse]:
        """Retorna todos os eventos ordenados por ano."""
        events = (
            self.db.query(HistoricalEvent)
            .order_by(HistoricalEvent.year_start)
            .all()
        )
        return [self._to_response(e) for e in events]

    def get_filtered(
        self,
        start_year: int,
        end_year: int,
        continent: Optional[str] = None
    ) -> EventGeoCollection:
        """Retorna eventos filtrados como GeoJSON."""
        query = self.db.query(HistoricalEvent).filter(
            and_(
                HistoricalEvent.year_start >= start_year,
                HistoricalEvent.year_start <= end_year
            )
        )
        
        if continent and continent != "Todos":
            query = query.filter(HistoricalEvent.continent == continent)

        events = query.all()
        features = [self._to_geo_feature(e) for e in events]
        
        return EventGeoCollection(features=features)

    def create(self, event_data: EventCreate) -> dict:
        """Cria ou atualiza um evento."""
        # Verifica duplicata
        existing = self._find_existing(event_data.name, event_data.year_start)
        
        if existing: 
            return self._handle_existing(existing, event_data)
        
        return self._create_new(event_data)

    def delete(self, event_id: int) -> bool:
        """Deleta um evento pelo ID."""
        event = self.db.query(HistoricalEvent).filter(
            HistoricalEvent.id == event_id
        ).first()
        
        if not event:
            return False
        
        self.db.delete(event)
        self.db.commit()
        return True

    # ========================================================================
    # MÉTODOS PRIVADOS
    # ========================================================================

    def _find_existing(self, name: str, year:  int) -> Optional[HistoricalEvent]:
        """Busca evento existente por nome e ano."""
        return self.db.query(HistoricalEvent).filter(
            HistoricalEvent.name.ilike(name),
            HistoricalEvent.year_start == year
        ).first()

    def _handle_existing(self, existing: HistoricalEvent, new_data: EventCreate) -> dict:
        """Lida com evento duplicado - atualiza se apropriado."""
        should_update = (
            existing.source in (EventSource.MANUAL, None) and
            new_data.source in ("wikidata", "seed")
        )
        
        if should_update:
            existing.source = EventSource(new_data.source)
            existing.continent = new_data.continent
            
            if new_data.content and len(new_data.content) > len(existing.content or ""):
                existing.content = new_data.content
            
            self.db.commit()
            return {"status": "updated", "id": existing.id}
        
        return {"status": "skipped", "id":  existing.id}

    def _create_new(self, event_data: EventCreate) -> dict:
        """Cria novo evento."""
        period = event_data.period or calculate_period(event_data.year_start)
        wkt = f"SRID=4326;POINT({event_data.longitude} {event_data.latitude})"
        
        event = HistoricalEvent(
            name=event_data.name,
            description=event_data.description,
            content=event_data.content,
            year_start=event_data.year_start,
            year_end=event_data.year_end,
            continent=event_data.continent,
            period=period,
            source=EventSource(event_data.source),
            location=wkt
        )
        
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        
        return {"status":  "created", "id": event.id, "name": event.name}

    def _to_response(self, event: HistoricalEvent) -> EventResponse: 
        """Converte modelo para schema de resposta."""
        shape = to_shape(event.location)
        return EventResponse(
            id=event.id,
            name=event.name,
            description=event.description,
            content=event.content,
            year_start=event.year_start,
            year_end=event.year_end,
            continent=event.continent,
            period=event.period,
            source=event.source.value if event.source else None,
            latitude=shape.y,
            longitude=shape.x
        )

    def _to_geo_feature(self, event: HistoricalEvent) -> EventGeoFeature:
        """Converte modelo para GeoJSON Feature."""
        geom = to_shape(event.location)
        return EventGeoFeature(
            geometry=mapping(geom),
            properties={
                "id": event.id,
                "name": event.name,
                "description": event.description,
                "content": event.content,
                "year": event.year_start,
                "year_end": event.year_end, # <--- ADICIONE ESTA LINHA
                "period": event.period,
                "continent": event.continent,
                "source": event.source.value if event.source else None
            }
        )