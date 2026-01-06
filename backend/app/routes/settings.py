from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel

from ..database import get_db, SessionLocal
from ..models import IntegrationDefinition, UserIntegration, GeonamesCity
from ..services.task_manager import task_manager
from ..seeders.integrations import seed_integrations
from ..etl.geonames.loader import sync_geonames_data

router = APIRouter(prefix="/settings", tags=["settings"])

# --- Schemas ---
class IntegrationDefOut(BaseModel):
    id: int
    slug: str
    name: str
    description: str
    logo_url: str
    form_schema: List[Dict[str, Any]]
    is_connected: bool = False
    connected_id: int | None = None

class ConnectRequest(BaseModel):
    definition_id: int
    name: str
    credentials: Dict[str, Any]

# --- Rotas de Integração Genérica ---

@router.post("/init")
def initialize_definitions(db: Session = Depends(get_db)):
    """Gatilho para rodar o Seeder."""
    seed_integrations(db)
    return {"status": "definitions_seeded"}

@router.get("/integrations", response_model=List[IntegrationDefOut])
def list_available_integrations(db: Session = Depends(get_db)):
    defs = db.query(IntegrationDefinition).all()
    user_integs = db.query(UserIntegration).filter_by(is_active=True).all()
    
    connected_map = {ui.definition_id: ui.id for ui in user_integs}

    result = []
    for d in defs:
        connected_id = connected_map.get(d.id)
        result.append({
            "id": d.id,
            "slug": d.slug,
            "name": d.name,
            "description": d.description,
            "logo_url": d.logo_url,
            "form_schema": d.form_schema,
            "is_connected": connected_id is not None,
            "connected_id": connected_id
        })
    return result

@router.post("/integrations/connect")
def connect_integration(req: ConnectRequest, db: Session = Depends(get_db)):
    # 1. Desativa anteriores (Adicionado synchronize_session=False para evitar erros)
    db.query(UserIntegration)\
      .filter_by(definition_id=req.definition_id)\
      .update({"is_active": False}, synchronize_session=False)
    
    # 2. Cria nova
    new_integ = UserIntegration(
        definition_id=req.definition_id,
        name=req.name,
        credentials=req.credentials,
        is_active=True
    )
    db.add(new_integ)
    db.commit()
    db.refresh(new_integ) # Garante que temos o ID gerado
    return {"status": "connected", "id": new_integ.id}

@router.delete("/integrations/{integration_id}")
def disconnect_integration(integration_id: int, db: Session = Depends(get_db)):
    integ = db.query(UserIntegration).filter_by(id=integration_id).first()
    if integ:
        db.delete(integ)
        db.commit()
    return {"status": "disconnected"}

# --- Rotas do GeoNames (QUE ESTAVAM FALTANDO) ---

@router.get("/geonames/stats")
def get_geonames_stats(db: Session = Depends(get_db)):
    """Retorna quantos registros temos no banco."""
    # Se a tabela não existir ainda, retorna 0 (try/except opcional, mas o hook deve ter criado)
    try:
        count = db.query(GeonamesCity).count()
        return {"total_cities": count}
    except Exception:
        return {"total_cities": 0}

@router.post("/geonames/sync")
def sync_geonames(bg_tasks: BackgroundTasks):
    """Dispara o processo de atualização do GeoNames."""
    task_id = task_manager.create_task("Atualização GeoNames")
    
    def run_sync(tid: str):
        db = SessionLocal()
        try:
            sync_geonames_data(db, tid)
        finally:
            db.close()
            
    bg_tasks.add_task(run_sync, task_id)
    return {"task_id": task_id, "status": "started"}