from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from ..database import Base

class WikidataExtraction(Base):
    """
    Histórico de extrações realizadas no Wikidata.
    Armazena logs de execução do robô para auditoria.
    """
    __tablename__ = "extractions"
    
    __table_args__ = {"schema": "wikidata"}

    id = Column(Integer, primary_key=True, index=True)
    
    # Parâmetros usados na busca
    continent = Column(String(50), nullable=False)
    year_start = Column(Integer, nullable=False)
    year_end = Column(Integer, nullable=False)
    
    # Resultado da execução
    status = Column(String(50), default="running") # running, success, error, timeout
    events_found = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    
    # Metadados de tempo
    started_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<WikiExtract {self.continent} ({self.year_start}-{self.year_end})>"