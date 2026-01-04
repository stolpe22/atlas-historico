from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uuid
from ..database import get_db, SessionLocal
from ..models import KaggleConfig
from ..etl.kaggle.extractor import extract_and_load_staging
from ..etl.kaggle.processor import process_staging_to_events
from ..services.task_manager import task_manager

router = APIRouter(prefix="/kaggle", tags=["kaggle"])

# --- Schemas Locais ---
class ConfigCreate(BaseModel):
    name: str
    username: str
    api_key: str

class ImportRequest(BaseModel):
    kaggle_id: str

@router.post("/config")
def save_config(config: ConfigCreate, db: Session = Depends(get_db)):
    db.query(KaggleConfig).update({"is_active": False})
    new_config = KaggleConfig(name=config.name, username=config.username, api_key=config.api_key, is_active=True)
    db.add(new_config)
    db.commit()
    return {"status": "saved"}

@router.get("/config/active")
def check_config(db: Session = Depends(get_db)):
    exists = db.query(KaggleConfig).filter(KaggleConfig.is_active == True).first()
    return {"has_config": bool(exists)}

# --- Background Task Genérica ---
def _run_etl_task(task_id: str, dataset_id: str):
    db = SessionLocal()
    
    # Callbacks desacoplados
    def log_wrapper(msg):
        task_manager.log(task_id, msg)

    def stop_wrapper():
        return task_manager.should_stop(task_id)

    try:
        task_manager.set_status(task_id, "running")
        task_manager.log(task_id, "⬇️ Verificando Dataset...")
        
        # 1. Extract
        db_dataset_id = extract_and_load_staging(db, dataset_id)
        task_manager.log(task_id, "✅ Dataset pronto.")
        
        # 2. Process (Passando os wrappers do Task Manager)
        count = process_staging_to_events(
            db, 
            db_dataset_id, 
            limit=2000, 
            log_callback=log_wrapper, 
            stop_check_callback=stop_wrapper # <--- Passa a verificação
        )
        
        # Verificação final de status
        if task_manager.should_stop(task_id):
            task_manager.set_status(task_id, "cancelled")
            task_manager.log(task_id, "🛑 Cancelado com sucesso.")
        else:
            task_manager.set_status(task_id, "completed")
            task_manager.log(task_id, f"🏁 Finalizado! {count} itens.")

    except Exception as e:
        task_manager.set_status(task_id, "error")
        task_manager.log(task_id, f"❌ Erro Fatal: {str(e)}")
        print(f"Erro task {task_id}: {e}")
    finally:
        db.close()

# --- Rotas Padronizadas ---

@router.post("/import")
def start_import(req: ImportRequest, bg_tasks: BackgroundTasks):
    # 1. Cria a tarefa no gerenciador central
    task_id = task_manager.create_task(name="Importação Kaggle")
    
    # 2. Dispara o background
    bg_tasks.add_task(_run_etl_task, task_id, req.kaggle_id)
    
    return {"task_id": task_id, "status": "started"}

@router.post("/stop/{task_id}")
def stop_import(task_id: str):
    """Solicita parada via Task Manager."""
    if task_manager.request_stop(task_id):
        return {"status": "stopping"}
    return {"status": "not_running_or_invalid"}

@router.get("/status/{task_id}")
def get_status(task_id: str):
    """Consulta o Task Manager."""
    task = task_manager.get_task(task_id)
    if not task:
        return {"status": "not_found", "logs": []}
    return task