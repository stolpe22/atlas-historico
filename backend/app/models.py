from sqlalchemy import Column, Integer, String, Float, Text, Boolean
from geoalchemy2 import Geometry
from .database import Base
import enum

# 1. Definindo as opções do ENUM
class EventSource(str, enum.Enum):
    MANUAL = "manual"      # Criado pelo usuário
    WIKIDATA = "wikidata"  # Baixado do robô
    SEED = "seed"          # Do arquivo JSON fixo

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
    
    # Usamos String no banco para facilitar, mas o Python valida o Enum
    source = Column(String, default=EventSource.MANUAL.value, index=True) 
    
    location = Column(Geometry('POINT', srid=4326))