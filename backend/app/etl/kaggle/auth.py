import os
from sqlalchemy.orm import Session
from app.models import KaggleConfig

def configure_kaggle_env(db: Session):
    """
    Busca a credencial ativa no banco e injeta nas variáveis de ambiente.
    Isso permite que o 'kagglehub' funcione sem arquivo kaggle.json local.
    """
    config = db.query(KaggleConfig).filter(KaggleConfig.is_active == True).first()
    
    if not config:
        raise ValueError("❌ Nenhuma configuração do Kaggle ativa encontrada no banco de dados.")

    # Injeção de Variáveis de Ambiente (Runtime)
    # A lib do Kaggle busca automaticamente por estas chaves
    os.environ['KAGGLE_USERNAME'] = config.username
    os.environ['KAGGLE_KEY'] = config.api_key
    
    # Se você estiver usando aquele token específico KGAT_..., 
    # algumas libs aceitam KAGGLE_API_TOKEN, então garantimos as duas formas:
    os.environ['KAGGLE_API_TOKEN'] = config.api_key

    print(f"🔑 Credenciais Kaggle configuradas para: {config.username}")