from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routes import events_router, populate_router, kaggle_router, settings_router
from .config import get_settings

settings = get_settings()

# Cria tabelas
Base.metadata.create_all(bind=engine)

# Inicializa app
app = FastAPI(
    title="Atlas Histórico API",
    description="API para gerenciamento de eventos históricos geográficos",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas
app.include_router(events_router)
app.include_router(populate_router)
app.include_router(kaggle_router)
app.include_router(settings_router)


@app.get("/health")
def health_check():
    """Endpoint de health check."""
    return {"status": "healthy", "version": "2.0.0"}