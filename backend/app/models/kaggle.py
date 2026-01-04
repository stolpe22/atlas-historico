from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from ..database import Base

class KaggleConfig(Base):
    """Configurações de API do Kaggle (Chaves e Tokens)."""
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
    """Catálogo de Datasets (Metadados)."""
    __tablename__ = "datasets"
    __table_args__ = {"schema": "kaggle"}

    id = Column(Integer, primary_key=True, index=True)
    
    # Identificador do Kaggle (ex: "saketk511/world-important-events...")
    kaggle_id = Column(String(200), unique=True, nullable=False)
    
    title = Column(String(300))
    description = Column(Text, nullable=True)
    
    local_path = Column(String(500), nullable=True)
    status = Column(String(50), default="pending") 
    
    last_sync = Column(DateTime, nullable=True)
    record_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relacionamento: Um dataset tem várias linhas brutas
    raw_data = relationship("KaggleStaging", back_populates="dataset", cascade="all, delete-orphan")

class KaggleStaging(Base):
    """
    Tabela de Staging (Camada Raw).
    Armazena o conteúdo de QUALQUER dataset em formato JSONB.
    """
    __tablename__ = "staging"
    __table_args__ = {"schema": "kaggle"}

    id = Column(Integer, primary_key=True, index=True)
    
    # FK para o dataset pai
    dataset_id = Column(Integer, ForeignKey("kaggle.datasets.id"), nullable=False, index=True)
    
    # O dado bruto (linha do CSV convertida para JSON)
    data = Column(JSONB, nullable=False)
    
    # Controle de processamento (Raw -> Gold)
    processed = Column(Boolean, default=False)
    error_msg = Column(Text, nullable=True)

    dataset = relationship("KaggleDataset", back_populates="raw_data")