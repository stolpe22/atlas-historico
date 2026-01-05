from sqlalchemy import Column, Integer, String, JSON, Boolean, Text
from ..database import Base

class KaggleStaging(Base):
    """
    Tabela de Staging Simplificada.
    Armazena os dados brutos vindos do Kaggle antes de processar.
    """
    __tablename__ = "kaggle_staging"

    id = Column(Integer, primary_key=True, index=True)
    
    # O ID do dataset no formato string (ex: "saketk511/world-events")
    kaggle_id = Column(String(255), index=True, nullable=False) 
    
    # O dado bruto (JSON do CSV)
    raw_data = Column(JSON, nullable=False)

    # 👇 Colunas de Controle (Necessárias para o Processor)
    processed = Column(Boolean, default=False, index=True)
    error_msg = Column(Text, nullable=True)

    def __repr__(self):
        return f"<KaggleStaging {self.id} - {self.kaggle_id}>"

# Classes antigas mantidas para compatibilidade (opcional)
class KaggleConfig(Base):
    __tablename__ = "kaggle_configs_deprecated"
    id = Column(Integer, primary_key=True)

class KaggleDataset(Base):
    __tablename__ = "kaggle_datasets_deprecated"
    id = Column(Integer, primary_key=True)