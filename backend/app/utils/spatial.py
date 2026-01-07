from sqlalchemy.orm import Session
from sqlalchemy import text

def get_continent_from_coords(db: Session, lat: float, lon: float) -> str:
    """
    Função reutilizável para detectar continente via interseção espacial no PostGIS.
    """
    # Validação básica
    if lat is None or lon is None or (lat == 0 and lon == 0):
        return "Desconhecido"

    # Query otimizada usando ST_Intersects
    sql = text("""
        SELECT name FROM settings.continents_shapes 
        WHERE ST_Intersects(geom, ST_SetSRID(ST_Point(:lon, :lat), 4326))
        LIMIT 1
    """)
    
    try:
        # Forçamos float
        result = db.execute(sql, {"lon": float(lon), "lat": float(lat)}).fetchone()
        return result[0] if result else "Oceano / Outro"
    except Exception as e:
        print(f"⚠️ Erro Spatial Service: {str(e)}")
        return "Erro na Detecção"