from sqlalchemy import create_engine, event, DDL # <--- 1. Adicione event e DDL aqui
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from typing import Generator

from .config import get_settings

settings = get_settings()

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Isso diz ao SQLAlchemy: "Antes de criar qualquer tabela, 
# rode este comando SQL para garantir que a pasta 'settings' exista".
event.listen(
    Base.metadata, 
    "before_create", 
    DDL("CREATE SCHEMA IF NOT EXISTS settings")
)
# -------------------------------------

def get_db() -> Generator[Session, None, None]:
    """Dependency para injeção de sessão do banco."""
    db = SessionLocal()
    try:
        yield db
    finally: 
        db.close()