import requests
import time
import json
import os
import re
from datetime import datetime

# --- CONFIGURAÇÕES ---
API_URL = "http://localhost:8000/events"
WIKIDATA_URL = "https://query.wikidata.org/sparql"

HEADERS = {
    "User-Agent": "AtlasHistoricoBot/37.0 (Single Mode)",
    "Accept": "application/json"
}

CONTINENT_MAP = {
    "América do Sul": "Q18",
    "Europa": "Q46",
    "América do Norte": "Q49",
    "África": "Q15",
    "Ásia": "Q48",
    "Oceania": "Q55643",
    "Antártida": "Q51"
}

# --- CONTROLE DE ESTADO ---
CONTROL_STATE = {
    "stop_requested": False
}

def request_stop():
    """Chamado pela API para erguer a bandeira de parada"""
    CONTROL_STATE["stop_requested"] = True
    print("🛑 [BACKEND] SINAL DE PARADA RECEBIDO!")

def should_stop():
    return CONTROL_STATE["stop_requested"]

def reset_stop_flag():
    CONTROL_STATE["stop_requested"] = False

# --- FUNÇÕES AUXILIARES ---

def determine_period(year):
    if year < -4000: return "Pré-História"
    if year < 476: return "Idade Antiga"
    if year < 1453: return "Idade Média"
    if year < 1789: return "Idade Moderna"
    return "Idade Contemporânea"

def save_debug_query(query, region_name, interval_str):
    try:
        log_dir = os.path.join(os.path.dirname(__file__), "debug_queries")
        os.makedirs(log_dir, exist_ok=True)
        safe_region = "".join(x for x in region_name if x.isalnum() or x in " _-").strip()
        filename = f"{log_dir}/query_{safe_region}_{interval_str}.sparql"
        with open(filename, "w", encoding="utf-8") as f:
            f.write(query)
    except: pass

def get_wiki_summary(article_url):
    if not article_url: return None
    try:
        title = article_url.split("/wiki/")[-1]
        lang = "pt" if "pt.wikipedia" in article_url else "en"
        api_url = f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{title}"
        r = requests.get(api_url, headers=HEADERS, timeout=3)
        if r.status_code == 200: return r.json().get("extract") 
    except: return None
    return None

def populate_from_json_file(status_callback=None):
    if should_stop(): return
    if status_callback: status_callback("📂 Inserindo dados manuais (Seed)...")
    file_path = os.path.join(os.path.dirname(__file__), "manual_events.json")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            manual_events = json.load(f)
        for evt in manual_events:
            if should_stop(): return
            if 'is_manual' in evt: del evt['is_manual']
            evt['period'] = determine_period(int(evt["year_start"]))
            evt['source'] = "seed"
            requests.post(API_URL, json=evt)
    except: pass

# --- PROCESSAMENTO PRINCIPAL ---

def process_query_results(query, region_name, status_callback, interval_label):
    if should_stop(): return False, 0

    try:
        r = requests.get(WIKIDATA_URL, params={'query': query, 'format': 'json'}, headers=HEADERS, timeout=30)
        
        if should_stop(): 
            if status_callback: status_callback("🛑 Parando após download...")
            return False, 0

        if r.status_code == 200:
            items = r.json()['results']['bindings']
            total = len(items)
            count = 0
            
            if total == 0: return True, 0
            
            timestamp = datetime.now().strftime("%H:%M:%S")
            if status_callback: 
                status_callback(f"[{timestamp}] 📥 {region_name} [{interval_label}]: {total} encontrados.")
            
            for i, item in enumerate(items):
                if should_stop(): return False, count

                try:
                    name = item.get("itemLabel", {}).get("value")
                    if not name or name.startswith("Q"): continue
                    
                    date_start_str = item.get("start", {}).get("value", "")
                    if not date_start_str: continue 

                    def get_year(d_str):
                        try:
                            if d_str.startswith('-'): return int(d_str[0:5]) 
                            return int(d_str[0:4])
                        except: return None

                    year_start = get_year(date_start_str)
                    if year_start is None: continue

                    year_end = year_start # Simplificação para MVP

                    coord_str = item.get("coord", {}).get("value", "")
                    if not coord_str: continue
                    c_raw = coord_str.replace("Point(", "").replace(")", "").split(" ")
                    
                    article_url = item.get("article", {}).get("value", "")
                    full_content = None
                    
                    if article_url:
                        if should_stop(): return False, count
                        full_content = get_wiki_summary(article_url)
                        time.sleep(0.01)

                    desc = item.get("itemDescription", {}).get("value", "Evento Histórico")
                    
                    payload = {
                        "name": str(name),
                        "description": str(desc),
                        "content": full_content if full_content else desc,
                        "year_start": int(year_start),
                        "year_end": int(year_end),
                        "latitude": float(c_raw[1]),
                        "longitude": float(c_raw[0]),
                        "continent": region_name,
                        "period": determine_period(year_start),
                        "source": "wikidata"
                    }
                    requests.post(API_URL, json=payload)
                    count += 1
                except: continue
            return True, count
    except Exception as e: 
        print(f"Erro Request: {e}")
    return False, 0

# --- PONTO DE ENTRADA ÚNICO ---
def run_unified_logic(status_callback, target_continents, start_year, end_year):
    reset_stop_flag()
    
    selected_ids = [ (cid, name) for name, cid in CONTINENT_MAP.items() if name in target_continents ]
    
    if not selected_ids:
        if status_callback: status_callback("⚠️ Selecione um continente!")
        return

    total_added_session = 0
    STEP = 10 

    for continent_id, continent_name in selected_ids:
        current_start = int(start_year)
        final_target = int(end_year)
        
        while current_start < final_target:
            if should_stop():
                if status_callback: status_callback("🛑 Processo CANCELADO.")
                return 

            current_end = current_start + STEP
            if current_end > final_target: current_end = final_target
            
            interval_str = f"{current_start} a {current_end}"
            
            # Query SPARQL Otimizada
            query = f"""
            SELECT DISTINCT ?item ?itemLabel ?itemDescription ?start ?end ?coord ?article WHERE {{
              ?item wdt:P585|wdt:P580 ?date .
              FILTER(YEAR(?date) >= {current_start} && YEAR(?date) < {current_end})

              VALUES ?type {{ 
                wd:Q1190554 wd:Q198 wd:Q8465 wd:Q178561 wd:Q1261499 
                wd:Q131569 wd:Q625298 wd:Q1023929 wd:Q124734 wd:Q6534 wd:Q132821
              }}
              ?item wdt:P31/wdt:P279* ?type . 
              ?item wdt:P276?/wdt:P17/wdt:P30 wd:{continent_id} .

              OPTIONAL {{ ?item wdt:P580 ?st . }}
              BIND(COALESCE(?st, ?date) AS ?start)

              OPTIONAL {{ ?item wdt:P625 ?loc1 . }}
              OPTIONAL {{ ?item wdt:P276/wdt:P625 ?loc2 . }}
              OPTIONAL {{ ?item wdt:P17/wdt:P625 ?loc3 . }}
              BIND(COALESCE(?loc1, ?loc2, ?loc3) AS ?coord)
              FILTER(BOUND(?coord))

              MINUS {{ ?item wdt:P31/wdt:P279* wd:Q3863 . }} 
              MINUS {{ ?item wdt:P31/wdt:P279* wd:Q44235 . }}

              OPTIONAL {{ ?article schema:about ?item ; schema:inLanguage "pt" ; schema:isPartOf <https://pt.wikipedia.org/> . }}
              SERVICE wikibase:label {{ bd:serviceParam wikibase:language "pt,en". }}
            }}
            ORDER BY DESC(?start) LIMIT 500
            """
            
            save_debug_query(query, continent_name, interval_str)
            success, count = process_query_results(query, continent_name, status_callback, interval_str)
            if success: total_added_session += count
            
            current_start += STEP
            if should_stop(): return
            time.sleep(0.5) 
    
    if status_callback: status_callback(f"🏁 Concluído! Total: {total_added_session}.")