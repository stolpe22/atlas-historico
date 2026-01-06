from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import engine, Base
from .routes import events_router, populate_router, settings_router, etl_router, docs_router
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

app.mount("/docs/assets", StaticFiles(directory="docs/integrations/assets"), name="docs_assets")

# Rotas
app.include_router(events_router)
app.include_router(populate_router)
app.include_router(etl_router)
app.include_router(settings_router)
app.include_router(docs_router)


@app.get("/health")
def health_check():
    """Endpoint de health check."""
    return {"status": "healthy", "version": "2.0.0"}