import requests
import time
from typing import List, Dict, Optional, Callable
from dataclasses import dataclass

from ..config import get_settings
from ..utils.helpers import calculate_period, parse_wikidata_year, parse_wikidata_coordinates

settings = get_settings()


@dataclass
class WikidataEvent:
    """Evento extraído da Wikidata."""
    name: str
    description: str
    content: Optional[str]
    year_start: int
    year_end: int
    latitude: float
    longitude: float
    continent: str
    period: str


class WikidataService:
    """Serviço para extração de dados da Wikidata."""

    CONTINENT_MAP = {
        "América do Sul": "Q18",
        "Europa": "Q46",
        "América do Norte": "Q49",
        "África": "Q15",
        "Ásia": "Q48",
        "Oceania": "Q55643",
        "Antártida": "Q51"
    }

    HEADERS = {
        "User-Agent": "AtlasHistoricoBot/2.0 (Refactored)",
        "Accept":  "application/json"
    }

    def __init__(self):
        self.url = settings.wikidata_url
        self.timeout = settings.wikidata_timeout
        self.delay = settings.wikidata_delay

    def fetch_events(
        self,
        continent: str,
        start_year: int,
        end_year: int,
        status_callback: Optional[Callable[[str], None]] = None
    ) -> List[WikidataEvent]:
        """Busca eventos de um continente em um período."""
        continent_id = self.CONTINENT_MAP.get(continent)
        if not continent_id:
            return []

        query = self._build_query(continent_id, start_year, end_year)
        
        try:
            response = requests.get(
                self.url,
                params={'query': query, 'format': 'json'},
                headers=self.HEADERS,
                timeout=self.timeout
            )
            response.raise_for_status()
            
            items = response.json()['results']['bindings']
            events = self._parse_results(items, continent)
            
            if status_callback: 
                status_callback(f"📥 {continent} [{start_year}-{end_year}]:  {len(events)} eventos")
            
            return events
            
        except requests.RequestException as e: 
            if status_callback:
                status_callback(f"❌ Erro em {continent}: {str(e)}")
            return []

    def get_wiki_summary(self, article_url: str) -> Optional[str]:
        """Obtém resumo de artigo da Wikipedia."""
        if not article_url: 
            return None
        
        try: 
            title = article_url.split("/wiki/")[-1]
            lang = "pt" if "pt.wikipedia" in article_url else "en"
            api_url = f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{title}"
            
            response = requests.get(api_url, headers=self.HEADERS, timeout=3)
            if response.status_code == 200:
                return response.json().get("extract")
        except requests.RequestException:
            pass
        
        return None

    # ========================================================================
    # MÉTODOS PRIVADOS
    # ========================================================================

    def _build_query(self, continent_id: str, start_year: int, end_year: int) -> str:
        """Constrói query SPARQL otimizada."""
        return f"""
        SELECT DISTINCT ?item ?itemLabel ?itemDescription ?start ?end ?coord ?article WHERE {{
          ? item wdt:P585|wdt:P580 ? date .
          FILTER(YEAR(? date) >= {start_year} && YEAR(?date) < {end_year})

          VALUES ?type {{ 
            wd:Q1190554 wd:Q198 wd:Q8465 wd:Q178561 wd:Q1261499 
            wd:Q131569 wd:Q625298 wd:Q1023929 wd:Q124734 wd:Q6534 wd:Q132821
          }}
          ? item wdt:P31/wdt:P279* ? type .
          ?item wdt:P276? /wdt:P17/wdt:P30 wd:{continent_id} .

          OPTIONAL {{ ?item wdt: P580 ?st .}}
          BIND(COALESCE(?st, ?date) AS ?start)

          OPTIONAL {{ ? item wdt:P625 ?loc1 .}}
          OPTIONAL {{ ?item wdt:P276/wdt:P625 ?loc2 .}}
          OPTIONAL {{ ?item wdt:P17/wdt:P625 ?loc3 .}}
          BIND(COALESCE(?loc1, ? loc2, ?loc3) AS ?coord)
          FILTER(BOUND(?coord))

          MINUS {{ ?item wdt:P31/wdt:P279* wd: Q3863 .}} 
          MINUS {{ ?item wdt:P31/wdt:P279* wd: Q44235 .}}

          OPTIONAL {{ 
            ? article schema:about ?item ; 
            schema:inLanguage "pt" ; 
            schema: isPartOf <https://pt.wikipedia.org/> .
          }}
          SERVICE wikibase:label {{ bd:serviceParam wikibase:language "pt,en".}}
        }}
        ORDER BY DESC(?start) LIMIT {settings.query_limit}
        """

    def _parse_results(self, items:  List[Dict], continent: str) -> List[WikidataEvent]:
        """Processa resultados da Wikidata."""
        events = []
        
        for item in items:
            event = self._parse_single_item(item, continent)
            if event:
                events.append(event)
                time.sleep(0.01)  # Rate limiting para Wikipedia
        
        return events

    def _parse_single_item(self, item:  Dict, continent: str) -> Optional[WikidataEvent]: 
        """Processa um item individual."""
        try:
            name = item.get("itemLabel", {}).get("value")
            if not name or name.startswith("Q"):
                return None

            date_str = item.get("start", {}).get("value", "")
            year_start = parse_wikidata_year(date_str)
            if year_start is None: 
                return None

            coord_str = item.get("coord", {}).get("value", "")
            coords = parse_wikidata_coordinates(coord_str)
            if not coords: 
                return None

            article_url = item.get("article", {}).get("value", "")
            content = self.get_wiki_summary(article_url) if article_url else None
            description = item.get("itemDescription", {}).get("value", "Evento Histórico")

            return WikidataEvent(
                name=str(name),
                description=str(description),
                content=content or description,
                year_start=year_start,
                year_end=year_start,
                latitude=coords[0],
                longitude=coords[1],
                continent=continent,
                period=calculate_period(year_start)
            )
        except Exception:
            return None