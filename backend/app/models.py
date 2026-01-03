from sqlalchemy import Column, Integer, String, Float, Text, Boolean # <--- Adicione Boolean
from geoalchemy2 import Geometry
from .database import Base

class HistoricalEvent(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    content = Column(Text, nullable=True)
    year_start = Column(Integer, index=True)
    year_end = Column(Integer, nullable=True)
    continent = Column(String, index=True)
    period = Column(String, index=True)
    is_manual = Column(Boolean, default=False) # <--- NOVO CAMPO
    
    location = Column(Geometry('POINT', srid=4326))