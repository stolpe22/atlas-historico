import os
import requests
import zipfile
import io
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models import GeonamesCity
from app.services.task_manager import task_manager

GEONAMES_URL = "http://download.geonames.org/export/dump/cities1000.zip"

def sync_geonames_data(db: Session, task_id: str):
    """
    ETL Completo: Download -> Parse -> Truncate -> Bulk Insert
    """
    def log(msg):
        task_manager.log(task_id, msg)

    try:
        # 1. Download
        log("⬇️ Iniciando download do GeoNames (cities1000.zip)...")
        response = requests.get(GEONAMES_URL, stream=True)
        response.raise_for_status()

        # 2. Processamento em Memória
        log("📦 Extraindo e processando CSV na memória...")
        with zipfile.ZipFile(io.BytesIO(response.content)) as z:
            with z.open('cities1000.txt') as f:
                # GeoNames não tem header, definimos manualmente
                col_names = [
                    'geonameid', 'name', 'asciiname', 'alternatenames', 
                    'latitude', 'longitude', 'feature class', 'feature code', 
                    'country code', 'cc2', 'admin1 code', 'admin2 code', 
                    'admin3 code', 'admin4 code', 'population', 'elevation', 
                    'dem', 'timezone', 'modification date'
                ]
                
                # Lê apenas o necessário
                df = pd.read_csv(
                    f, 
                    sep='\t', 
                    header=None, 
                    names=col_names,
                    usecols=['geonameid', 'name', 'asciiname', 'latitude', 'longitude', 'country code', 'population'],
                    dtype={'name': str, 'asciiname': str, 'country code': str}
                )

        total = len(df)
        log(f"✅ Processado. {total} cidades encontradas.")

        # 3. Limpeza do Banco (Truncate é mais rápido que delete)
        log("🧹 Limpando tabela antiga (Truncate)...")
        db.execute(text("TRUNCATE TABLE geonames_cities RESTART IDENTITY;"))
        db.commit()

        # 4. Inserção em Lotes (Bulk Insert)
        log("💾 Inserindo dados no banco (isso pode demorar um pouco)...")
        
        # Converte DataFrame para lista de dicionários para o SQLAlchemy
        data_to_insert = df.to_dict(orient='records')
        
        # Insere em lotes de 5000 para não estourar memória do banco
        batch_size = 5000
        for i in range(0, total, batch_size):
            batch = data_to_insert[i : i + batch_size]
            
            # Mapeamento Dict -> Model
            objects = [
                GeonamesCity(
                    geoname_id=row['geonameid'],
                    name=str(row['name'])[:200],
                    asciiname=str(row['asciiname'])[:200],
                    latitude=row['latitude'],
                    longitude=row['longitude'],
                    country_code=str(row['country code'])[:2],
                    population=row['population']
                ) for row in batch
            ]
            
            db.bulk_save_objects(objects)
            db.commit()
            
            # Log de progresso a cada 20 mil
            if (i + batch_size) % 20000 == 0:
                log(f"📈 Progresso: {i + batch_size}/{total} cidades inseridas...")

        log(f"🏁 Sucesso! {total} cidades disponíveis offline.")
        task_manager.set_status(task_id, "completed")

    except Exception as e:
        log(f"❌ Erro Crítico: {str(e)}")
        task_manager.set_status(task_id, "error")
        raise e