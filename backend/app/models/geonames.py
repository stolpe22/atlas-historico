from sqlalchemy import Column, Integer, String, Float, Index
from ..database import Base

class GeonamesCity(Base):
    __tablename__ = "geonames_cities"

    id = Column(Integer, primary_key=True)
    geoname_id = Column(Integer, unique=True, index=True)
    
    name = Column(String(200), index=True)
    asciiname = Column(String(200), index=True)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    country_code = Column(String(2), index=True)
    # 👇 NOVA COLUNA
    country_name = Column(String(100), index=True) 
    
    population = Column(Integer)
    
    __table_args__ = (
        Index('idx_geo_lat_lon', 'latitude', 'longitude'),
    )

    def __repr__(self):
        return f"<City {self.name}, {self.country_name}>"