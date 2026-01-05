import os
from ..base import BaseEtlAdapter
from ...services.task_manager import task_manager
# Importa suas lógicas existentes
from .extractor import extract_and_load_staging
from .processor import process_staging_to_events

class KaggleAdapter(BaseEtlAdapter):
    
    def run(self, db, task_id, credentials, params):
        # 1. Configurar Credenciais (Environment Injection)
        os.environ['KAGGLE_USERNAME'] = credentials.get('username', 'admin')
        os.environ['KAGGLE_KEY'] = credentials.get('api_key', '')

        try:
            dataset_id = params.get('kaggle_id')
            if not dataset_id:
                raise ValueError("Parâmetro 'kaggle_id' é obrigatório.")

            task_manager.log(task_id, f"⬇️ Iniciando adaptador Kaggle para: {dataset_id}")

            # 2. Reutiliza sua lógica de Extração
            db_dataset_id = extract_and_load_staging(db, dataset_id)
            task_manager.log(task_id, "✅ Download e Staging concluídos.")

            # 3. Callbacks para o Processador
            def log_wrapper(msg):
                task_manager.log(task_id, msg)
            
            def stop_wrapper():
                return task_manager.should_stop(task_id)

            # 4. Reutiliza sua lógica de Processamento
            count = process_staging_to_events(
                db, 
                db_dataset_id, 
                limit=2000, 
                log_callback=log_wrapper, 
                stop_check_callback=stop_wrapper
            )
            
            return count

        finally:
            # Limpeza de segurança
            os.environ.pop('KAGGLE_USERNAME', None)
            os.environ.pop('KAGGLE_KEY', None)