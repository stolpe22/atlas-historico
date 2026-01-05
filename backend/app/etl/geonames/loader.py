import os
import requests
import zipfile
import io
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models import GeonamesCity
from app.services.task_manager import task_manager

CITIES_URL = "http://download.geonames.org/export/dump/cities1000.zip"
COUNTRY_INFO_URL = "http://download.geonames.org/export/dump/countryInfo.txt"

def sync_geonames_data(db: Session, task_id: str):
    """
    ETL Enriquecido:
    1. Baixa countryInfo.txt para mapear siglas (BR -> Brazil)
    2. Baixa cities1000.zip
    3. Cruza os dados
    4. Salva no banco
    """
    def log(msg):
        task_manager.log(task_id, msg)

    try:
        # --- PASSO 1: BAIXAR DICIONÁRIO DE PAÍSES ---
        log("🌍 Baixando tabela de países (countryInfo)...")
        c_resp = requests.get(COUNTRY_INFO_URL)
        c_resp.raise_for_status()
        
        # O arquivo tem comentários com '#', pulamos eles
        countries_df = pd.read_csv(
            io.StringIO(c_resp.text), 
            sep='\t', 
            comment='#', 
            header=None,
            names=['ISO', 'ISO3', 'ISO-Numeric', 'fips', 'Country', 'Capital', 'Area', 'Population', 'Continent', 'tld', 'CurrencyCode', 'CurrencyName', 'Phone', 'Postal Code Format', 'Postal Code Regex', 'Languages', 'geonameid', 'neighbours', 'EquivalentFipsCode'],
            usecols=['ISO', 'Country']
        )
        
        # Cria um dicionário rápido: {'BR': 'Brazil', 'AD': 'Andorra'}
        country_map = pd.Series(countries_df.Country.values, index=countries_df.ISO).to_dict()
        log(f"✅ Mapeamento de {len(country_map)} países carregado.")

        # --- PASSO 2: BAIXAR CIDADES ---
        log("⬇️ Iniciando download do GeoNames (cities1000.zip)...")
        response = requests.get(CITIES_URL, stream=True)
        response.raise_for_status()

        log("📦 Extraindo e processando CSV na memória...")
        with zipfile.ZipFile(io.BytesIO(response.content)) as z:
            with z.open('cities1000.txt') as f:
                col_names = [
                    'geonameid', 'name', 'asciiname', 'alternatenames', 
                    'latitude', 'longitude', 'feature class', 'feature code', 
                    'country code', 'cc2', 'admin1 code', 'admin2 code', 
                    'admin3 code', 'admin4 code', 'population', 'elevation', 
                    'dem', 'timezone', 'modification date'
                ]
                
                df = pd.read_csv(
                    f, 
                    sep='\t', 
                    header=None, 
                    names=col_names,
                    usecols=['geonameid', 'name', 'asciiname', 'latitude', 'longitude', 'country code', 'population'],
                    dtype={'name': str, 'asciiname': str, 'country code': str}
                )

        # --- PASSO 3: ENRIQUECIMENTO (Cruza Sigla com Nome) ---
        log("🗺️ Aplicando nomes de países aos registros...")
        # Cria a coluna country_name baseada no country code usando o mapa
        df['country_name'] = df['country code'].map(country_map).fillna('Unknown')
        
        total = len(df)
        log(f"✅ Processado. {total} cidades prontas.")

        # --- PASSO 4: BANCO DE DADOS ---
        log("🧹 Limpando tabela antiga...")
        db.execute(text("TRUNCATE TABLE geonames_cities RESTART IDENTITY;"))
        db.commit()

        log("💾 Inserindo dados no banco...")
        
        data_to_insert = df.to_dict(orient='records')
        batch_size = 5000
        
        for i in range(0, total, batch_size):
            batch = data_to_insert[i : i + batch_size]
            
            objects = [
                GeonamesCity(
                    geoname_id=row['geonameid'],
                    name=str(row['name'])[:200],
                    asciiname=str(row['asciiname'])[:200],
                    latitude=row['latitude'],
                    longitude=row['longitude'],
                    country_code=str(row['country code'])[:2],
                    country_name=str(row['country_name'])[:100], # <--- Campo Novo
                    population=row['population']
                ) for row in batch
            ]
            
            db.bulk_save_objects(objects)
            db.commit()
            
            if (i + batch_size) % 20000 == 0:
                log(f"📈 Progresso: {i + batch_size}/{total}...")

        log(f"🏁 Sucesso! {total} cidades disponíveis offline.")
        task_manager.set_status(task_id, "completed")

    except Exception as e:
        log(f"❌ Erro Crítico: {str(e)}")
        task_manager.set_status(task_id, "error")
        # raise e # Opcional: remover raise se quiser que o backend continue rodando