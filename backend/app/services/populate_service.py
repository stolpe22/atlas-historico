import json
import os
import time
import requests
from typing import List, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime

from ..config import get_settings
from .wikidata_service import WikidataService
from ..utils.helpers import calculate_period

settings = get_settings()
API_URL = f"http://{settings.api_host}:{settings.api_port}"

@dataclass
class PopulationState:
    is_running: bool = False
    message: str = "Aguardando início..."
    stop_requested: bool = False
    def reset(self):
        self.is_running = False
        self.message = "Aguardando início..."
        self.stop_requested = False

_state = PopulationState()

class PopulateService:
    """Serviço para população de dados."""
    def __init__(self):
        self.wikidata = WikidataService()
        self.state = _state

    @property
    def status(self) -> dict:
        return { "is_running": self.state.is_running, "message": self.state.message }

    def request_stop(self) -> None:
        self.state.stop_requested = True
        self._update_status("🛑 Parando... Aguarde.")

    def reset(self) -> None:
        self.state.reset()

    def run_wikidata_extraction(self, continents: List[str], start_year: int, end_year: int) -> None:
        self.state.is_running = True
        self.state.stop_requested = False
        total_added = 0
        step = settings.query_step_years
        try:
            for continent in continents:
                if self._should_stop(): break
                current = start_year
                while current < end_year:
                    if self._should_stop(): break
                    chunk_end = min(current + step, end_year)
                    events = self.wikidata.fetch_events(
                        continent=continent,
                        start_year=current,
                        end_year=chunk_end,
                        status_callback=self._update_status
                    )
                    for event in events:
                        if self._should_stop(): break
                        self._post_event(event)
                        total_added += 1
                    current += step
                    time.sleep(settings.wikidata_delay)
            if not self._should_stop():
                self._update_status(f"🏁 Concluído! Total:  {total_added}")
            else:
                self._update_status("🛑 Processo cancelado pelo usuário.")
        except Exception as e:
            self._update_status(f"❌ Erro:  {str(e)}")
        finally:
            self.state.is_running = False

    def run_seed(self) -> None:
        self.state.is_running = True
        self.state.stop_requested = False
        try:
            self._update_status("📂 Lendo arquivo de dados...")
            file_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                "data",
                "manual_events.json"
            )
            with open(file_path, "r", encoding="utf-8") as f:
                events = json.load(f)
            count = 0
            for evt in events:
                if self._should_stop(): break
                evt.pop('is_manual', None)
                evt['period'] = calculate_period(int(evt["year_start"]))
                evt['source'] = "seed"
                requests.post(f"{API_URL}/events", json=evt)
                count += 1
            self._update_status(f"✅ {count} eventos inseridos!")
        except FileNotFoundError:
            self._update_status(f"❌ Arquivo não encontrado: {file_path}")
        except Exception as e:
            self._update_status(f"❌ Erro: {str(e)}")
        finally:
            self.state.is_running = False

    def _should_stop(self) -> bool:
        return self.state.stop_requested

    def _update_status(self, message: str) -> None:
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.state.message = f"[{timestamp}] {message}"
        print(f"STATUS: {self.state.message}")

    def _post_event(self, event) -> None:
        payload = {
            "name": event.name,
            "description": event.description,
            "content": event.content,
            "year_start": event.year_start,
            "year_end": event.year_end,
            "latitude": event.latitude,
            "longitude": event.longitude,
            "continent": event.continent,
            "period": event.period,
            "source": "wikidata"
        }
        requests.post(f"{API_URL}/events", json=payload)