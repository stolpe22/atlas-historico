import json
import os
from ..base import BaseEtlAdapter
from ...services.task_manager import task_manager
from ...services.event_service import EventService
from ...schemas import EventCreate

class SeedAdapter(BaseEtlAdapter):
    def run(self, db, task_id, credentials, params):
        task_manager.log(task_id, "📂 Lendo arquivo manual_events.json...")
        
        file_path = os.path.join(os.getcwd(), "data", "manual_events.json")
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Arquivo não encontrado em: {file_path}")

        with open(file_path, "r", encoding="utf-8") as f:
            events = json.load(f)

        service = EventService(db)
        total = len(events)
        added = 0

        for i, evt_data in enumerate(events):
            if task_manager.should_stop(task_id):
                task_manager.log(task_id, "🛑 Cancelamento solicitado.")
                return added

            # Limpa dados irrelevantes e garante a fonte
            evt_data.pop('is_manual', None)
            evt_data['source'] = 'seed'
            
            # Usa o EventCreate para validar via Pydantic antes de salvar
            schema_data = EventCreate(**evt_data)
            service.create(schema_data)
            
            added += 1
            if i % 2 == 0:
                task_manager.log(task_id, f"📈 Restaurando: {i+1}/{total} - {evt_data['name']}")

        return f"{added} eventos restaurados com sucesso."