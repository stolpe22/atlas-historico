import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Tenta pegar do ambiente (Docker), se não achar, usa localhost (Local com uv run)
DB_HOST = os.getenv("DB_HOST", "localhost")
DATABASE_URL = f"postgresql://admin:admin@{DB_HOST}:5432/history_atlas"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()