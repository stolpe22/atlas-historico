from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import engine, Base, SessionLocal
from .routes import events_router, settings_router, etl_router, docs_router
from .config import get_settings
from .seeders.spatial_seeder import seed_continents
from .seeders.integrations import seed_integrations
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
app.include_router(etl_router)
app.include_router(settings_router)
app.include_router(docs_router)

@app.on_event("startup")
async def startup_event():
    # 1. Primeiro garantimos que o Schema e as Tabelas existam
    # O SQLAlchemy criará o schema 'settings' por causa do evento que colocamos no database.py
    # e criará a tabela 'continents_shapes'
    print("🛠️ Verificando estrutura do banco...")
    Base.metadata.create_all(bind=engine)
    
    # 2. Agora que a tabela EXISTE com certeza, rodamos os seeders
    db = SessionLocal()
    try:
        print("🌱 Iniciando semente de dados...")
        seed_integrations(db)
        # O seed_continents agora não vai mais falhar, pois a tabela já foi criada acima
        seed_continents(db)
        print("🚀 Startup concluído com sucesso!")
    except Exception as e:
        print(f"❌ Erro no startup: {e}")
    finally:
        db.close()

@app.get("/health")
def health_check():
    """Endpoint de health check."""
    return {"status": "healthy", "version": "2.0.0"}