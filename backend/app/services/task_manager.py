import uuid
from typing import Dict, List, Optional, Callable

class TaskManager:
    """
    Gerenciador global de tarefas em background (Singleton).
    Armazena logs e controla o estado (Running/Canceling/Completed).
    """
    _instance = None
    _tasks: Dict[str, Dict] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TaskManager, cls).__new__(cls)
        return cls._instance

    def create_task(self, name: str = "Tarefa") -> str:
        """Inicia uma nova tarefa e retorna o ID."""
        task_id = str(uuid.uuid4())
        self._tasks[task_id] = {
            "name": name,
            "status": "pending",
            "logs": [],
            "progress": 0
        }
        return task_id

    def log(self, task_id: str, message: str):
        """Adiciona uma mensagem ao log da tarefa."""
        if task_id in self._tasks:
            self._tasks[task_id]["logs"].append(message)

    def set_status(self, task_id: str, status: str):
        """Muda o status (running, completed, error, canceling, cancelled)."""
        if task_id in self._tasks:
            self._tasks[task_id]["status"] = status

    def get_task(self, task_id: str) -> Optional[Dict]:
        """Retorna os dados da tarefa para o Frontend."""
        return self._tasks.get(task_id)

    def request_stop(self, task_id: str) -> bool:
        """O Frontend chama isso para pedir parada."""
        if task_id in self._tasks and self._tasks[task_id]["status"] == "running":
            self._tasks[task_id]["status"] = "canceling"
            self.log(task_id, "⚠️ Solicitação de parada recebida...")
            return True
        return False

    def should_stop(self, task_id: str) -> bool:
        """
        O Script ETL chama isso dentro do loop:
        if task_manager.should_stop(id): break
        """
        task = self._tasks.get(task_id)
        return task is not None and task["status"] == "canceling"

# Instância global para ser importada
task_manager = TaskManager()