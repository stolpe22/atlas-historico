from sqlalchemy import Column, Integer, String, Text, Enum as SQLEnum, Index
from geoalchemy2 import Geometry
from enum import Enum
from ..database import Base

class EventSource(str, Enum):
    MANUAL = "manual"
    WIKIDATA = "wikidata"
    SEED = "seed"
    KAGGLE = "kaggle"

class HistoricalEvent(Base):
    """
    Modelo principal de evento histórico (Schema Public).
    Aqui ficam apenas os dados higienizados e prontos para o mapa.
    """
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(500), index=True, nullable=False)
    description = Column(String(1000))
    content = Column(Text, nullable=True)
    
    # Anos normalizados (ex: -2600 para 2600 a.C.)
    year_start = Column(Integer, index=True, nullable=False)
    year_end = Column(Integer, nullable=True)
    
    continent = Column(String(100), index=True)
    period = Column(String(100), index=True)
    
    source = Column(
        SQLEnum(EventSource, values_callable=lambda x: [e.value for e in x]),
        default=EventSource.MANUAL,
        index=True
    )
    
    # PostGIS Geometry
    location = Column(Geometry('POINT', srid=4326, spatial_index=True), nullable=False)
    def __repr__(self) -> str:
        return f"<Event {self.id}: {self.name}>"