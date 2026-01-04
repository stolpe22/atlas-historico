from sqlalchemy.schema import CreateSchema
from ..database import engine

# ============================================================================
# INICIALIZAÇÃO DE SCHEMAS
# ============================================================================
# Garante que os schemas 'kaggle' e 'wikidata' existam no banco ao iniciar
try:
    with engine.connect() as connection:
        connection.execute(CreateSchema('kaggle', if_not_exists=True))
        connection.execute(CreateSchema('wikidata', if_not_exists=True))
        connection.commit()
except Exception as e:
    # Em produção, use logging. Aqui o print ajuda a debugar containers.
    print(f"⚠️  [Database] Aviso de Schema: {e}")

# ============================================================================
# EXPORTAÇÃO DE MODELOS
# ============================================================================
from .events import HistoricalEvent, EventSource
from .kaggle import KaggleConfig, KaggleDataset, KaggleStaging
from .wikidata import WikidataExtraction
from .geonames import GeonamesCity

__all__ = [
    "HistoricalEvent", 
    "EventSource",
    "KaggleConfig", 
    "KaggleDataset",
    "KaggleStaging",
    "WikidataExtraction",
    "GeonamesCity"
]