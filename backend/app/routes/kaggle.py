from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os

from ..database import get_db, SessionLocal
# 👇 Mudamos os models importados
from ..models import IntegrationDefinition, UserIntegration 
from ..etl.kaggle.extractor import extract_and_load_staging
from ..etl.kaggle.processor import process_staging_to_events
from ..services.task_manager import task_manager

router = APIRouter(prefix="/kaggle", tags=["kaggle"])

# --- Schemas Locais ---
class ImportRequest(BaseModel):
    kaggle_id: str

# 👇 Rota atualizada para verificar na tabela NOVA
@router.get("/config/active")
def check_config(db: Session = Depends(get_db)):
    """Verifica se existe uma integração ativa com o slug 'kaggle'."""
    exists = db.query(UserIntegration)\
        .join(IntegrationDefinition)\
        .filter(IntegrationDefinition.slug == 'kaggle')\
        .filter(UserIntegration.is_active == True)\
        .first()
    
    return {"has_config": bool(exists)}

# A rota POST /config foi removida pois agora usamos a tela de Settings genérica.

# --- Background Task ---

def _run_etl_task(task_id: str, dataset_id: str):
    db = SessionLocal()
    
    def log_wrapper(msg):
        task_manager.log(task_id, msg)

    def stop_wrapper():
        return task_manager.should_stop(task_id)

    try:
        task_manager.set_status(task_id, "running")
        
        # 1. BUSCAR CREDENCIAIS (Do banco novo)
        integration = db.query(UserIntegration)\
            .join(IntegrationDefinition)\
            .filter(IntegrationDefinition.slug == 'kaggle')\
            .filter(UserIntegration.is_active == True)\
            .first()
            
        if not integration:
            raise Exception("Configuração do Kaggle não encontrada ou inativa.")
            
        credentials = integration.credentials # Isso é um dict: {'username': '...', 'api_key': '...'}
        
        # Configura Variáveis de Ambiente temporárias para a lib do Kaggle usar
        os.environ['KAGGLE_USERNAME'] = credentials.get('username', 'admin')
        os.environ['KAGGLE_KEY'] = credentials.get('api_key', '')

        task_manager.log(task_id, "⬇️ Verificando Dataset...")
        
        # 2. Extract (Agora não precisa buscar config dentro dele, pois setamos o ENV acima)
        db_dataset_id = extract_and_load_staging(db, dataset_id)
        
        task_manager.log(task_id, "✅ Dataset pronto.")
        
        # 3. Process
        count = process_staging_to_events(
            db, 
            db_dataset_id, 
            limit=2000, 
            log_callback=log_wrapper, 
            stop_check_callback=stop_wrapper
        )
        
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
        # Limpa variáveis de ambiente por segurança
        os.environ.pop('KAGGLE_USERNAME', None)
        os.environ.pop('KAGGLE_KEY', None)
        db.close()

# --- Rotas Padronizadas ---

@router.post("/import")
def start_import(req: ImportRequest, bg_tasks: BackgroundTasks):
    task_id = task_manager.create_task(name="Importação Kaggle")
    bg_tasks.add_task(_run_etl_task, task_id, req.kaggle_id)
    return {"task_id": task_id, "status": "started"}

@router.post("/stop/{task_id}")
def stop_import(task_id: str):
    if task_manager.request_stop(task_id):
        return {"status": "stopping"}
    return {"status": "not_running_or_invalid"}

@router.get("/status/{task_id}")
def get_status(task_id: str):
    task = task_manager.get_task(task_id)
    if not task:
        return {"status": "not_found", "logs": []}
    return task