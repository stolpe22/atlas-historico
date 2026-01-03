from sqlalchemy import Column, Integer, String, Float
from geoalchemy2 import Geometry
from .database import Base

class HistoricalEvent(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    year_start = Column(Integer, index=True)
    year_end = Column(Integer, nullable=True)
    continent = Column(String, index=True)
    period = Column(String, index=True)  # <--- NOVA COLUNA
    
    # SRID 4326 = WGS 84 (Padrão GPS Latitude/Longitude)
    location = Column(Geometry('POINT', srid=4326))