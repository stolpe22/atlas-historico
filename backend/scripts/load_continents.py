import requests
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import get_settings
from app.models.spatial import ContinentShape
from sqlalchemy import text

URL = "https://gist.githubusercontent.com/hrbrmstr/91ea5cc9474286c72838/raw/59421ff9b268ff0929b051ddafafbeb94a4c1910/continents.json"

def run():
    settings = get_settings()
    engine = create_engine(settings.database_url)
    Session = sessionmaker(bind=engine)
    db = Session()

    print("🌐 Baixando polígonos dos continentes...")
    res = requests.get(URL)
    data = res.json()

    print(f"📥 Encontrados {len(data['features'])} polígonos. Limpando tabela antiga...")
    db.execute(text("TRUNCATE TABLE settings.continents_shapes RESTART IDENTITY CASCADE"))
    
    for feature in data['features']:
        name = feature['properties']['CONTINENT']
        # Convertemos o dict da geometria para string WKT que o PostGIS entende
        geom_json = json.dumps(feature['geometry'])
        
        print(f"  -> Inserindo: {name}")
        
        # Usamos ST_GeomFromGeoJSON para converter o GeoJSON direto no insert
        sql = text("""
            INSERT INTO settings.continents_shapes (name, geom)
            VALUES (:name, ST_Multi(ST_GeomFromGeoJSON(:geom)))
        """)
        db.execute(sql, {"name": name, "geom": geom_json})
    
    db.commit()
    print("✅ Continentes carregados com sucesso!")

if __name__ == "__main__":
    run()