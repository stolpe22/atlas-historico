from sqlalchemy.schema import CreateSchema
from ..database import engine

# ============================================================================
# INICIALIZAÇÃO DE SCHEMAS
# ============================================================================
try:
    with engine.connect() as connection:
        connection.execute(CreateSchema('kaggle', if_not_exists=True))
        connection.execute(CreateSchema('wikidata', if_not_exists=True))
        connection.commit()
except Exception as e:
    print(f"⚠️  [Database] Aviso de Schema: {e}")

# ============================================================================
# EXPORTAÇÃO DE MODELOS (LIMPA)
# ============================================================================
from .events import HistoricalEvent, EventSource
# AQUI: Removido KaggleConfig e KaggleDataset
from .kaggle import KaggleStaging 
from .wikidata import WikidataExtraction
from .geonames import GeonamesCity
from .integrations import IntegrationDefinition, UserIntegration

__all__ = [
    "HistoricalEvent", 
    "EventSource",
    "KaggleStaging",
    "WikidataExtraction",
    "GeonamesCity",
    "IntegrationDefinition",
    "UserIntegration"
]