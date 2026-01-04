import requests
from typing import List, Dict
from collections import defaultdict

from ..config import get_settings

settings = get_settings()


class DeduplicateService: 
    """Serviço para deduplicação inteligente de eventos."""

    API_URL = "http://localhost:8000/events"

    def __init__(self, tolerance_years: int = None):
        self.tolerance = tolerance_years or settings.year_tolerance

    def run(self) -> int:
        """Executa deduplicação e retorna quantidade removida."""
        print("🧠 Iniciando Deduplicação Inteligente...")

        events = self._fetch_all_events()
        if not events:
            return 0

        print(f"📦 Total de eventos: {len(events)}")

        grouped = self._group_by_name(events)
        deleted_count = self._process_groups(grouped)

        print(f"🏁 Limpeza concluída!  Total apagado: {deleted_count}")
        return deleted_count

    # ========================================================================
    # MÉTODOS PRIVADOS
    # ========================================================================

    def _fetch_all_events(self) -> List[Dict]: 
        """Busca todos os eventos da API."""
        try:
            response = requests.get(f"{self.API_URL}/all")
            return response.json()
        except Exception as e:
            print(f"❌ Erro ao conectar na API: {e}")
            return []

    def _group_by_name(self, events: List[Dict]) -> Dict[str, List[Dict]]:
        """Agrupa eventos por nome (case insensitive)."""
        groups = defaultdict(list)
        for event in events:
            name = event['name'].strip().lower()
            groups[name].append(event)
        return groups

    def _process_groups(self, groups: Dict[str, List[Dict]]) -> int:
        """Processa grupos e remove duplicatas."""
        deleted_count = 0

        for name, items in groups.items():
            if len(items) < 2:
                continue

            items.sort(key=lambda x: x['year_start'])
            clusters = self._clusterize_by_year(items)

            for cluster in clusters: 
                deleted_count += self._process_cluster(cluster, name)

        return deleted_count

    def _clusterize_by_year(self, items: List[Dict]) -> List[List[Dict]]:
        """Agrupa eventos próximos por ano."""
        clusters = []
        current_cluster = [items[0]]

        for i in range(1, len(items)):
            prev = current_cluster[-1]
            curr = items[i]
            diff = abs(curr['year_start'] - prev['year_start'])

            if diff <= self.tolerance:
                current_cluster.append(curr)
            else:
                clusters.append(current_cluster)
                current_cluster = [curr]

        clusters.append(current_cluster)
        return clusters

    def _process_cluster(self, cluster:  List[Dict], name: str) -> int:
        """Processa cluster removendo duplicatas."""
        if len(cluster) <= 1:
            return 0

        # Ordena:  prioriza quem tem continente e ID menor
        cluster.sort(
            key=lambda x: (
                1 if x.get('continent') else 0,
                -x['id']
            ),
            reverse=True
        )

        winner = cluster[0]
        losers = cluster[1:]

        print(f"\n🔸 Duplicados:  '{name}' (Anos: {[e['year_start'] for e in cluster]})")
        print(f"   👑 Mantendo ID {winner['id']}")

        deleted = 0
        for loser in losers: 
            try:
                requests.delete(f"{self.API_URL}/{loser['id']}")
                print(f"   🗑️ Removido ID {loser['id']}")
                deleted += 1
            except Exception as e: 
                print(f"   ❌ Erro ao deletar {loser['id']}: {e}")

        return deleted