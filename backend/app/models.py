from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.schema import CreateSchema
from geoalchemy2 import Geometry
from enum import Enum
from datetime import datetime

from .database import Base, engine

# ============================================================================
# INICIALIZAÇÃO DE SCHEMAS
# ============================================================================
try:
    with engine.connect() as connection:
        # Cria schema 'kaggle'
        connection.execute(CreateSchema('kaggle', if_not_exists=True))
        # Cria schema 'wikidata'
        connection.execute(CreateSchema('wikidata', if_not_exists=True))
        connection.commit()
except Exception:
    pass

# ============================================================================
# DOMÍNIO PÚBLICO (CORE)
# ============================================================================

class EventSource(str, Enum):
    MANUAL = "manual"
    WIKIDATA = "wikidata"
    SEED = "seed"
    KAGGLE = "kaggle"

class HistoricalEvent(Base):
    """Modelo principal de evento histórico (Schema Public)."""
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(500), index=True, nullable=False)
    description = Column(String(1000))
    content = Column(Text, nullable=True)
    year_start = Column(Integer, index=True, nullable=False)
    year_end = Column(Integer, nullable=True)
    continent = Column(String(100), index=True)
    period = Column(String(100), index=True)
    source = Column(
        SQLEnum(EventSource, values_callable=lambda x: [e.value for e in x]),
        default=EventSource.MANUAL,
        index=True
    )
    location = Column(Geometry('POINT', srid=4326), nullable=False)

    def __repr__(self) -> str:
        return f"<Event {self.id}: {self.name}>"

# ============================================================================
# DOMÍNIO KAGGLE
# ============================================================================

class KaggleConfig(Base):
    """Configurações de API do Kaggle."""
    __tablename__ = "configs"
    __table_args__ = {"schema": "kaggle"}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    username = Column(String(100), nullable=False)
    api_key = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

class KaggleDataset(Base):
    """Datasets do Kaggle gerenciados."""
    __tablename__ = "datasets"
    __table_args__ = {"schema": "kaggle"}

    id = Column(Integer, primary_key=True, index=True)
    kaggle_id = Column(String(200), unique=True, nullable=False)
    title = Column(String(300))
    local_path = Column(String(500), nullable=True)
    status = Column(String(50), default="pending")
    last_sync = Column(DateTime, nullable=True)
    record_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

# ============================================================================
# DOMÍNIO WIKIDATA
# ============================================================================

class WikidataExtraction(Base):
    """Histórico de extrações realizadas no Wikidata."""
    __tablename__ = "extractions"
    __table_args__ = {"schema": "wikidata"}

    id = Column(Integer, primary_key=True, index=True)
    
    # Parâmetros usados na busca
    continent = Column(String(50), nullable=False)
    year_start = Column(Integer, nullable=False)
    year_end = Column(Integer, nullable=False)
    
    # Resultado
    status = Column(String(50), default="running") # running, success, error, timeout
    events_found = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    
    # Metadados
    started_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<WikiExtract {self.continent} ({self.year_start}-{self.year_end})>"