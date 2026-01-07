# projeto/app/models/spatial.py
from sqlalchemy import Column, Integer, String
from geoalchemy2 import Geometry
from ..database import Base

class ContinentShape(Base):
    __tablename__ = "continents_shapes"
    __table_args__ = {"schema": "settings"} # Vamos guardar em settings por ser um dado de referência

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    # MULTIPOLYGON para aceitar o formato do JSON
    geom = Column(Geometry('MULTIPOLYGON', srid=4326), nullable=False)