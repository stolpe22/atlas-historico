import os
import json
import pandas as pd
from sqlalchemy.orm import Session
from ...models import KaggleStaging

# REMOVIDO DO TOPO: from kaggle.api.kaggle_api_extended import KaggleApi

def extract_and_load_staging(db: Session, dataset_id: str):
    """
    Baixa o dataset do Kaggle e salva na tabela Staging.
    """
    
    # 1. Autenticação (Importação Tardia para evitar crash no startup)
    try:
        # 👇 O IMPORT VEM PARA CÁ (LAZY IMPORT)
        from kaggle.api.kaggle_api_extended import KaggleApi
        
        api = KaggleApi()
        api.authenticate() # Agora vai funcionar pois o Adapter já setou as ENVs
    except Exception as e:
        raise Exception(f"Falha na autenticação do Kaggle. Verifique as credenciais: {str(e)}")

    download_path = "/tmp/kaggle_data"
    os.makedirs(download_path, exist_ok=True)

    # 2. Download
    print(f"⬇️ Baixando {dataset_id}...")
    try:
        api.dataset_download_files(dataset_id, path=download_path, unzip=True)
    except Exception as e:
        raise Exception(f"Erro ao baixar dataset: {str(e)}")

    # 3. Localizar o arquivo CSV correto
    target_file = "WorldImportantEvents.csv" 
    file_path = os.path.join(download_path, target_file)

    if not os.path.exists(file_path):
        files = [f for f in os.listdir(download_path) if f.endswith('.csv')]
        if not files:
            raise Exception("Nenhum arquivo CSV encontrado no dataset baixado.")
        file_path = os.path.join(download_path, files[0])

    # 4. Carregar no Pandas e Salvar no Staging
    print(f"📖 Lendo {file_path}...")
    df = pd.read_csv(file_path)
    
    # Limpa dados anteriores desse dataset para evitar duplicação no Staging
    db.query(KaggleStaging).filter(KaggleStaging.kaggle_id == dataset_id).delete()
    
    staging_objects = []
    for _, row in df.iterrows():
        # Converte NaN para None (JSON válido)
        row_dict = row.where(pd.notnull(row), None).to_dict()
        
        staging_objects.append(KaggleStaging(
            kaggle_id=dataset_id,
            raw_data=row_dict # Salva como JSONb
        ))

    print(f"💾 Salvando {len(staging_objects)} registros no Staging...")
    db.bulk_save_objects(staging_objects)
    db.commit()

    return dataset_id