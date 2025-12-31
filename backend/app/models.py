from sqlalchemy import Column, Integer, String, Text
from geoalchemy2 import Geometry
from .database import Base

class HistoricalEvent(Base):
    __tablename__ = "historical_events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)
    
    # Ano negativo = a.C., Ano positivo = d.C.
    year_start = Column(Integer, index=True) 
    year_end = Column(Integer, nullable=True) # Se for nulo, foi um evento pontual

    continent = Column(String, index=True, nullable=True) # <--- NOVO CAMPO
    
    # Coluna mágica do PostGIS. 
    # SRID 4326 é o padrão de GPS (Latitude/Longitude)
    location = Column(Geometry('POINT', srid=4326)) 
    
    # Futuramente você pode adicionar um campo 'relationships' para o Knowledge Graph