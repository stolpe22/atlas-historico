from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseEtlAdapter(ABC):
    """
    Contrato que toda integração deve seguir.
    """
    
    @abstractmethod
    def run(self, db_session, task_id: str, credentials: Dict[str, Any], params: Dict[str, Any]):
        """
        Executa o pipeline ETL.
        :param db_session: Sessão do banco
        :param task_id: ID da task para logs
        :param credentials: Dict vindo do banco (UserIntegration.credentials)
        :param params: Parâmetros enviados pelo front (ex: dataset_id)
        """
        pass