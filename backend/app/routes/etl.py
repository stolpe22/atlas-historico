from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any

from ..database import get_db, SessionLocal
from ..models import IntegrationDefinition, UserIntegration
from ..services.task_manager import task_manager
from ..etl.registry import get_adapter # <--- O segredo

router = APIRouter(prefix="/etl", tags=["etl"])

class RunEtlRequest(BaseModel):
    slug: str               # ex: "kaggle", "openai"
    params: Dict[str, Any]  # ex: { "kaggle_id": "..." }

def _background_etl_runner(task_id: str, slug: str, params: Dict[str, Any]):
    db = SessionLocal()
    try:
        task_manager.set_status(task_id, "running")
        
        # 1. Busca o Adaptador no Código
        adapter = get_adapter(slug)
        if not adapter:
            raise Exception(f"Adaptador para '{slug}' não implementado no backend.")

        # 2. Busca Credenciais no Banco (Tornamos opcional para o 'seed')
        integration = db.query(UserIntegration)\
            .join(IntegrationDefinition)\
            .filter(IntegrationDefinition.slug == slug)\
            .filter(UserIntegration.is_active == True)\
            .first()
            
        # Validamos: se NÃO for seed e NÃO tiver integração, aí sim damos erro
        if slug != "seed" and not integration:
            raise Exception(f"Nenhuma credencial ativa encontrada para '{slug}'. Configure em Settings.")

        # Pegamos as credenciais se existirem, senão enviamos um dict vazio
        credentials = integration.credentials if integration else {}

        # 3. Executa a Mágica Polimórfica
        result = adapter.run(
            db=db,
            task_id=task_id, 
            credentials=credentials, 
            params=params
        )

        # 4. Finalização
        if task_manager.should_stop(task_id):
            task_manager.set_status(task_id, "cancelled")
            task_manager.log(task_id, "🛑 Cancelado.")
        else:
            task_manager.set_status(task_id, "completed")
            task_manager.log(task_id, f"🏁 Sucesso! Resultado: {result}")

    except Exception as e:
        task_manager.set_status(task_id, "error")
        task_manager.log(task_id, f"❌ Erro: {str(e)}")
        print(f"Erro ETL {slug}: {e}")
    finally:
        db.close()

@router.post("/run")
def trigger_etl(req: RunEtlRequest, bg_tasks: BackgroundTasks):
    """
    Endpoint ÚNICO para rodar qualquer integração.
    """
    # Cria Task
    task_id = task_manager.create_task(name=f"ETL: {req.slug.capitalize()}")
    
    # Dispara Background
    bg_tasks.add_task(_background_etl_runner, task_id, req.slug, req.params)
    
    return {"task_id": task_id, "status": "started"}

# Rotas de Task Manager (Genéricas)
@router.post("/stop/{task_id}")
def stop_task(task_id: str):
    if task_manager.request_stop(task_id):
        return {"status": "stopping"}
    return {"status": "error"}

@router.get("/status/{task_id}")
def task_status(task_id: str):
    task = task_manager.get_task(task_id)
    return task or {"status": "not_found"}