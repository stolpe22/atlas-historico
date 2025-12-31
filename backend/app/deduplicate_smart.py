import requests

API_URL = "http://localhost:8000/events"
TOLERANCE_YEARS = 2  # Aceita diferença de até 2 anos pra cima ou pra baixo

def deduplicate_fuzzy():
    print("🧠 Iniciando Deduplicação Inteligente (Nome + Tolerância de Ano)...")
    
    try:
        # Pega tudo
        response = requests.get(f"{API_URL}/all")
        events = response.json()
    except Exception as e:
        print(f"❌ Erro ao conectar na API: {e}")
        return

    print(f"📦 Total de eventos analisados: {len(events)}")

    # 1. Agrupa puramente por NOME (Case insensitive pra garantir)
    name_groups = {}
    for event in events:
        name = event['name'].strip()
        if name not in name_groups:
            name_groups[name] = []
        name_groups[name].append(event)

    deleted_count = 0
    
    # 2. Analisa cada grupo de nomes
    for name, items in name_groups.items():
        if len(items) < 2:
            continue # Se só tem um com esse nome, tá seguro.

        # Ordena por ano para facilitar a comparação de proximidade
        items.sort(key=lambda x: x['year_start'])

        # Algoritmo de Clusterização (Agrupa os anos próximos)
        clusters = []
        current_cluster = [items[0]]

        for i in range(1, len(items)):
            prev = current_cluster[-1]
            curr = items[i]
            
            # Se a diferença de ano for pequena (<= 2), é o "mesmo" evento duplicado
            diff = abs(curr['year_start'] - prev['year_start'])
            
            if diff <= TOLERANCE_YEARS:
                current_cluster.append(curr)
            else:
                # Se for longe (ex: Batalha X em 1500 e outra Batalha X em 1900), fecha o cluster atual e abre um novo
                clusters.append(current_cluster)
                current_cluster = [curr]
        
        clusters.append(current_cluster) # Adiciona o último grupo

        # 3. Processa os Clusters (Deleta os duplicados dentro de cada cluster)
        for cluster in clusters:
            if len(cluster) > 1:
                # Temos duplicatas!
                # Critério de Vencedor:
                # 1. Tem continente? (Prioridade máxima)
                # 2. Se empate, ID menor (preserva o registro mais antigo/original)
                
                # Ordena: Quem tem continente vem primeiro (True > False)
                cluster.sort(key=lambda x: (1 if x.get('continent') else 0, -x['id']), reverse=True)
                
                winner = cluster[0]
                losers = cluster[1:]
                
                print(f"\n🔸 Grupo Duplicado: '{name}' (Anos: {[e['year_start'] for e in cluster]})")
                print(f"   👑 Mantendo: {winner['year_start']} - {winner.get('continent') or 'Sem Continente'} (ID: {winner['id']})")
                
                for loser in losers:
                    print(f"   🗑️  Apagando: {loser['year_start']} - {loser.get('continent') or 'Sem Continente'} (ID: {loser['id']})...")
                    try:
                        requests.delete(f"{API_URL}/{loser['id']}")
                        deleted_count += 1
                    except Exception as e:
                        print(f"      Erro ao deletar: {e}")

    print("-" * 30)
    print(f"🏁 Limpeza concluída! Total apagado: {deleted_count}")

if __name__ == "__main__":
    deduplicate_fuzzy()