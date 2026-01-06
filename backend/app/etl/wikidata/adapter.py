from ..base import BaseEtlAdapter
from ...services.task_manager import task_manager
from ...services.wikidata_service import WikidataService
import requests

class WikidataAdapter(BaseEtlAdapter):
    def run(self, db, task_id, credentials, params):
        # O Wikidata não exige login/key, mas se quiser passar via credentials, pode.
        service = WikidataService()
        
        continents = params.get("continents", ["Europa"])
        start_year = params.get("start_year", 1800)
        end_year = params.get("end_year", 1900)
        
        task_manager.log(task_id, f"🔍 Iniciando extração Wikidata: {continents}")
        
        def log_wrapper(msg):
            task_manager.log(task_id, msg)

        # O WikidataService já faz o loop. Vamos apenas orquestrar:
        # Nota: Adaptamos o service para enviar os eventos para a rota interna ou salvar via DB
        total_added = 0
        try:
            for continent in continents:
                if task_manager.should_stop(task_id): break
                
                events = service.fetch_events(
                    continent=continent,
                    start_year=start_year,
                    end_year=end_year,
                    status_callback=log_wrapper
                )
                
                for event in events:
                    if task_manager.should_stop(task_id): break
                    
                    # Chamada direta ao banco para performance (em vez de requests HTTP)
                    from ...services.event_service import EventService
                    from ...schemas import EventCreate
                    
                    event_schema = EventCreate(
                        name=event.name,
                        description=event.description,
                        content=event.content,
                        year_start=event.year_start,
                        year_end=event.year_end,
                        latitude=event.latitude,
                        longitude=event.longitude,
                        continent=event.continent,
                        period=event.period,
                        source="wikidata"
                    )
                    EventService(db).create(event_schema)
                    total_added += 1
            
            return f"{total_added} eventos extraídos da Wikidata."
        except Exception as e:
            raise Exception(f"Erro no adaptador Wikidata: {str(e)}")