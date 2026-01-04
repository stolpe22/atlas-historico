import kagglehub
import pandas as pd
import os
import glob
from sqlalchemy.orm import Session
from app.models import KaggleDataset, KaggleStaging
from .auth import configure_kaggle_env

def extract_and_load_staging(db: Session, kaggle_dataset_id: str):
    """
    Baixa o CSV e salva no Staging.
    TRAVA: Se já existir no banco, pula o download.
    """
    # 1. VERIFICAÇÃO INTELIGENTE (AQUI É A MUDANÇA)
    existing_dataset = db.query(KaggleDataset).filter(
        KaggleDataset.kaggle_id == kaggle_dataset_id
    ).first()

    # Se já existe e tem dados, não baixa de novo!
    if existing_dataset and existing_dataset.record_count > 0:
        print(f"📦 Dataset já carregado ({existing_dataset.record_count} registros). Pulando download.")
        return existing_dataset.id

    # --- Se não existe, segue o fluxo normal de download ---
    
    configure_kaggle_env(db)
    print(f"⬇️  Baixando dataset do Kaggle: {kaggle_dataset_id}...")
    
    try:
        path = kagglehub.dataset_download(kaggle_dataset_id)
        print(f"📂 Arquivos baixados em: {path}")
    except Exception as e:
        raise ConnectionError(f"Erro no download: {e}")

    csv_files = glob.glob(f"{path}/*.csv")
    if not csv_files:
        raise FileNotFoundError("Nenhum CSV encontrado.")
    
    csv_path = csv_files[0]
    
    # Cria ou Atualiza o registro do Dataset
    if not existing_dataset:
        dataset = KaggleDataset(
            kaggle_id=kaggle_dataset_id,
            title=kaggle_dataset_id.split("/")[-1],
            local_path=path,
            status="downloading"
        )
        db.add(dataset)
        db.commit()
        db.refresh(dataset)
    else:
        dataset = existing_dataset

    # Lê CSV e Salva no Staging
    df = pd.read_csv(csv_path)
    df = df.where(pd.notnull(df), None)
    records = df.to_dict(orient="records")
    total = len(records)
    
    print(f"💾 Salvando {total} registros brutos no banco...")
    
    staging_objects = []
    for row in records:
        staging_objects.append(
            KaggleStaging(dataset_id=dataset.id, data=row, processed=False)
        )
    
    db.bulk_save_objects(staging_objects)
    
    dataset.record_count = total
    dataset.status = "ready"
    db.commit()
    
    print("✅ Carga no Staging concluída.")
    return dataset.id