from sqlalchemy import Column, Integer, String, Float, Index
from ..database import Base

class GeonamesCity(Base):
    """
    Base de dados offline de cidades mundiais (GeoNames cities1000).
    Usado para geocoding reverso e autocomplete sem internet.
    """
    __tablename__ = "geonames_cities"
    # Schema public é o padrão, não precisa especificar __table_args__ se for public

    id = Column(Integer, primary_key=True) # ID interno
    geoname_id = Column(Integer, unique=True, index=True) # ID do GeoNames
    
    name = Column(String(200), index=True) # Nome oficial (UTF-8)
    asciiname = Column(String(200), index=True) # Nome sem acentos (para busca)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    country_code = Column(String(2), index=True) # BR, US, etc.
    population = Column(Integer)
    
    # Índice composto para buscar cidades rapidamente
    __table_args__ = (
        Index('idx_geo_lat_lon', 'latitude', 'longitude'),
    )

    def __repr__(self):
        return f"<City {self.name}, {self.country_code}>"