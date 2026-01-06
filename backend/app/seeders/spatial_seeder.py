import requests
import json
from sqlalchemy import text
from sqlalchemy.orm import Session

# URL do GeoJSON com os polígonos simplificados dos continentes
URL = "https://gist.githubusercontent.com/hrbrmstr/91ea5cc9474286c72838/raw/59421ff9b268ff0929b051ddafafbeb94a4c1910/continents.json"

# Dicionário de tradução consistente para o sistema
CONTINENT_MAPPING = {
    "North America": "América do Norte",
    "South America": "América do Sul",
    "Europe": "Europa",
    "Africa": "África",
    "Asia": "Ásia",
    "Oceania": "Oceania",
    "Antarctica": "Antártida",
    "Australia": "Oceania"
}

def seed_continents(db: Session):
    """
    Popula a tabela de formas geométricas dos continentes.
    Traduz os nomes para Português antes de salvar.
    """
    # 1. Verifica se já existem registros para evitar downloads repetidos
    try:
        count = db.execute(text("SELECT count(*) FROM settings.continents_shapes")).scalar()
        if count > 0:
            print("✅ Continentes já populados no banco.")
            return
    except Exception:
        # Se a tabela não existir, o Base.metadata.create_all no main.py cuidará disso antes
        print("⚠️ Tabela de continentes não encontrada, pulando seed temporariamente.")
        return

    print("🌐 Iniciando semeadura de polígonos dos continentes...")
    
    try:
        # 2. Baixa o GeoJSON
        response = requests.get(URL, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        # 3. Itera sobre os polígonos
        for feature in data['features']:
            name_en = feature['properties'].get('CONTINENT')
            
            # Aplica a tradução baseada no mapeamento
            name_pt = CONTINENT_MAPPING.get(name_en, name_en)
            
            # Converte o objeto de geometria para string JSON para o PostGIS
            geom_json = json.dumps(feature['geometry'])
            
            # 4. Insere usando função nativa do PostGIS para converter GeoJSON
            # ST_Multi garante que o dado seja MULTIPOLYGON mesmo que o original seja POLYGON
            sql = text("""
                INSERT INTO settings.continents_shapes (name, geom)
                VALUES (:name, ST_Multi(ST_GeomFromGeoJSON(:geom)))
                ON CONFLICT (name) DO NOTHING
            """)
            
            db.execute(sql, {"name": name_pt, "geom": geom_json})
        
        db.commit()
        print(f"✅ Sucesso: {len(data['features'])} polígonos de continentes carregados e traduzidos.")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Erro crítico ao semear continentes: {str(e)}")


def detect_continent_from_point(db: Session, lat: float, lon: float):
    """
    Detecta o continente usando um Buffer de segurança de 10km 
    para capturar pontos ligeiramente fora da costa.
    """
    if lat == 0 and lon == 0:
        return "Desconhecido"

    # 0.1 graus é aproximadamente 11km na linha do equador. 
    # É um valor seguro para capturar eventos costeiros.
    query = text("""
        SELECT name FROM settings.continents_shapes
        WHERE ST_Intersects(
            geom, 
            ST_Buffer(ST_SetSRID(ST_Point(:lon, :lat), 4326)::geography, 10000)::geometry
        )
        ORDER BY ST_Distance(geom, ST_SetSRID(ST_Point(:lon, :lat), 4326)) ASC
        LIMIT 1
    """)
    
    try:
        # Usamos geography para que o buffer de 10.000 (metros) seja preciso em qualquer lugar do globo
        result = db.execute(query, {"lon": lon, "lat": lat}).fetchone()
        return result[0] if result else "Outro"
    except Exception as e:
        print(f"⚠️ Erro na detecção espacial com Buffer: {e}")
        return "Desconhecido"