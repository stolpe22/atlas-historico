import requests
import sys
import time
import json
import os

# Configurações
API_URL = "http://localhost:8000/events"
WIKIDATA_URL = "https://query.wikidata.org/sparql"

# Headers robustos
HEADERS = {
    "User-Agent": "AtlasHistoricoBot/1.0 (https://github.com/seu-usuario/atlas; seu-email@example.com)",
    "Accept": "application/json"
}

# --- 1. POPULAÇÃO VIA ARQUIVO JSON LOCAL ---
def populate_from_json_file():
    print("📝 Lendo arquivo 'manual_events.json'...")
    
    file_path = os.path.join(os.path.dirname(__file__), "manual_events.json")
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            manual_events = json.load(f)
            
        print(f"📂 Arquivo carregado! Processando {len(manual_events)} eventos...")
        
        created = 0
        skipped = 0
        
        for evt in manual_events:
            payload = {
                "name": evt["name"],
                "description": evt["description"],
                "year_start": evt["year_start"],
                "year_end": evt.get("year_end"),
                "latitude": evt["latitude"],
                "longitude": evt["longitude"],
                "continent": evt["continent"]
            }
            try:
                r = requests.post(API_URL, json=payload)
                data = r.json()
                
                if data.get("status") == "created":
                    created += 1
                elif data.get("status") == "skipped":
                    skipped += 1
            except Exception as e:
                print(f"Erro ao postar {evt['name']}: {e}")
            
        print(f"✅ JSON Local: {created} novos | ⏭️ {skipped} repetidos (pulados).")
        
    except FileNotFoundError:
        print(f"❌ Erro: Arquivo '{file_path}' não encontrado!")
    except json.JSONDecodeError:
        print(f"❌ Erro: O arquivo '{file_path}' não é um JSON válido.")

# --- 2. WIKIDATA AUTOMÁTICA (COM RETRY) ---
def fetch_from_wikidata(continent_id, continent_name, limit=50):
    print(f"\n🌍 Buscando na Wikidata: {continent_name}...")
    
    query = f"""
    SELECT ?itemLabel ?itemDescription ?date ?coord WHERE {{
      ?item wdt:P30 wd:{continent_id}; 
            wdt:P31/wdt:P279* wd:Q1190554; 
            wdt:P585 ?date;
            wdt:P625 ?coord.
      
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "pt,en". }}
    }}
    ORDER BY DESC(?date)
    LIMIT {limit}
    """
    
    # Tenta até 3 vezes
    for attempt in range(1, 4):
        try:
            r = requests.get(WIKIDATA_URL, params={'query': query, 'format': 'json'}, headers=HEADERS, timeout=30)
            
            if r.status_code == 200:
                # Sucesso! Sai do loop de tentativas
                data = r.json()['results']['bindings']
                break
            elif r.status_code in [429, 500, 502, 503, 504]:
                print(f"⚠️ Erro {r.status_code} (Tentativa {attempt}/3). Aguardando 5s...")
                time.sleep(5)
            else:
                print(f"❌ Erro fatal {r.status_code}. Abortando este continente.")
                return

        except Exception as e:
            print(f"⚠️ Erro de conexão: {e} (Tentativa {attempt}/3).")
            time.sleep(5)
    else:
        print(f"❌ Falha após 3 tentativas para {continent_name}.")
        return

    # Processamento dos dados (Só chega aqui se deu 200 OK)
    created = 0
    skipped = 0
    total_items = len(data)
    
    for i, item in enumerate(data):
        try:
            name = item.get("itemLabel", {}).get("value")
            desc = item.get("itemDescription", {}).get("value", "Evento histórico.")
            date_str = item.get("date", {}).get("value", "")
            coord_str = item.get("coord", {}).get("value", "")
            
            if not date_str or not coord_str: continue
            
            year = int(date_str[0:4]) if not date_str.startswith('-') else int(date_str[0:5])
            coord = coord_str.replace("Point(", "").replace(")", "").split(" ")
            
            payload = {
                "name": name,
                "description": desc,
                "year_start": year,
                "year_end": year,
                "latitude": float(coord[1]),
                "longitude": float(coord[0]),
                "continent": continent_name
            }
            
            resp = requests.post(API_URL, json=payload)
            resp_data = resp.json()
            
            if resp_data.get("status") == "created":
                created += 1
                symbol = "📥"
            else:
                skipped += 1
                symbol = "⏭️"
            
            percent = int(((i+1) / total_items) * 100)
            sys.stdout.write(f"\r{symbol} Progresso: {percent}% ({created} novos / {skipped} pulados)")
            sys.stdout.flush()

        except: continue
        
    print(f"\n✅ {continent_name}: {created} importados | {skipped} já existiam.")

# --- 3. EXECUÇÃO ---
if __name__ == "__main__":
    populate_from_json_file()
    
    # Pausas maiores entre continentes
    time.sleep(2)
    fetch_from_wikidata("Q18", "América do Sul", limit=50)
    
    time.sleep(2)
    fetch_from_wikidata("Q49", "América do Norte", limit=50)
    
    time.sleep(2)
    fetch_from_wikidata("Q46", "Europa", limit=50)
    
    time.sleep(2)
    fetch_from_wikidata("Q48", "Ásia", limit=50)

    print("\n🏁 Processo Finalizado!")

def populate_manual():
    populate_from_json_file()