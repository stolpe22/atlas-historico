from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from ..database import get_db, SessionLocal
from ..models import KaggleConfig, GeonamesCity
from ..services.task_manager import task_manager
from ..etl.geonames.loader import sync_geonames_data

router = APIRouter(prefix="/settings", tags=["settings"])

# --- Schemas ---
class KaggleConfigOut(BaseModel):
    id: int
    username: str
    is_active: bool
    # Não retornamos a API Key por segurança, ou retornamos mascarada

# --- Rotas de Configuração (Kaggle) ---

@router.get("/integrations", response_model=List[KaggleConfigOut])
def get_integrations(db: Session = Depends(get_db)):
    """Lista configurações salvas."""
    configs = db.query(KaggleConfig).all()
    return configs

@router.delete("/integrations/{config_id}")
def delete_integration(config_id: int, db: Session = Depends(get_db)):
    """Remove uma integração."""
    cfg = db.query(KaggleConfig).filter(KaggleConfig.id == config_id).first()
    if not cfg:
        raise HTTPException(status_code=404, detail="Config não encontrada")
    
    db.delete(cfg)
    db.commit()
    return {"status": "deleted"}

# --- Rotas do GeoNames (Offline Data) ---

@router.get("/geonames/stats")
def get_geonames_stats(db: Session = Depends(get_db)):
    """Retorna quantos registros temos no banco."""
    count = db.query(GeonamesCity).count()
    return {"total_cities": count}

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