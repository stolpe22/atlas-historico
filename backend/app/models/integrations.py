from sqlalchemy import Column, Integer, String, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base

class IntegrationDefinition(Base):
    """
    Define os tipos de integração (Kaggle, Wikidata, etc).
    Fica no schema 'settings'.
    """
    __tablename__ = "integration_definitions"
    __table_args__ = {"schema": "settings"} # <--- A MÁGICA AQUI

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(50), unique=True, index=True)
    name = Column(String(100))
    description = Column(String(255))
    logo_url = Column(String(255))
    
    # JSON Schema para desenhar o form no front
    form_schema = Column(JSON, nullable=False)
    
    # Relacionamento (atenção ao string path com schema)
    instances = relationship("UserIntegration", back_populates="definition")

class UserIntegration(Base):
    """
    As conexões reais do usuário (com as chaves salvas).
    Fica no schema 'settings'.
    """
    __tablename__ = "user_integrations"
    __table_args__ = {"schema": "settings"} # <--- A MÁGICA AQUI

    id = Column(Integer, primary_key=True, index=True)
    definition_id = Column(Integer, ForeignKey("settings.integration_definitions.id")) # Note o prefixo settings.
    
    name = Column(String(100))
    credentials = Column(JSON, nullable=False) # {api_key: "...", username: "..."}
    is_active = Column(Boolean, default=True)

    definition = relationship("IntegrationDefinition", back_populates="instances")