import requests
import sys
import time
import json
import os
from urllib.parse import unquote

# ==============================================================================
# CONFIGURAÇÕES GERAIS
# ==============================================================================
API_URL = "http://localhost:8000/events"
WIKIDATA_URL = "https://query.wikidata.org/sparql"

HEADERS = {
    "User-Agent": "AtlasHistoricoBot/12.0 (Full Dual Mode)",
    "Accept": "application/json"
}

CONTINENT_IDS = [
    ("Q18", "América do Sul"),
    ("Q46", "Europa"),
    ("Q49", "América do Norte"),
    ("Q15", "África"),
    ("Q48", "Ásia"),
]

# Caixas delimitadoras para o Modo Varredura (Detailed)
# Formato: (Nome, Lon_Min, Lat_Min, Lon_Max, Lat_Max)
CONTINENT_BOXES = [
    ("América do Sul", -81.0, -56.0, -34.0, 13.0),
    ("Europa", -10.0, 36.0, 40.0, 70.0),
    ("América do Norte", -160.0, 15.0, -50.0, 72.0),
    ("Ásia", 40.0, 10.0, 140.0, 55.0),
    ("África", -18.0, -35.0, 52.0, 37.0)
]

# ==============================================================================
# FUNÇÕES AUXILIARES
# ==============================================================================

def determine_period(year):
    if year < -4000: return "Pré-História"
    if year < 476: return "Idade Antiga"
    if year < 1453: return "Idade Média"
    if year < 1789: return "Idade Moderna"
    return "Idade Contemporânea"

def get_wiki_summary(article_url):
    """Busca o resumo do artigo na API REST da Wikipedia"""
    if not article_url: return None
    try:
        title = article_url.split("/wiki/")[-1]
        lang = "pt" if "pt.wikipedia" in article_url else "en"
        api_url = f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{title}"
        r = requests.get(api_url, headers=HEADERS, timeout=2)
        if r.status_code == 200:
            return r.json().get("extract")
    except: return None
    return None

def populate_from_json_file(status_callback=None):
    if status_callback: status_callback("📂 Lendo arquivo manual...")
    file_path = os.path.join(os.path.dirname(__file__), "manual_events.json")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            manual_events = json.load(f)
        count = 0
        for evt in manual_events:
            try:
                # Garante integridade dos dados manuais
                evt['is_manual'] = False 
                evt['period'] = determine_period(int(evt["year_start"]))
                requests.post(API_URL, json=evt)
                count += 1
            except: pass
        if status_callback: status_callback(f"✅ JSON Base: {count} eventos carregados.")
    except: pass

# ==============================================================================
# 🚀 MODO TURBO (Busca por Categorias: Guerras, Tratados, etc)
# ==============================================================================
def fetch_massive_fast(continent_id, continent_name, status_callback):
    limit = 3500 
    
    msg = f"🚀 TURBO: Buscando Guerras e Eventos em {continent_name}..."
    print(msg)
    if status_callback: status_callback(msg)

    # Q1190554=Evento Histórico, Q198=Guerra, Q178=Batalha, Q131967=Tratado, Q1023929=Revolução
    query = f"""
    SELECT DISTINCT ?item ?itemLabel ?itemDescription ?date ?coord ?article WHERE {{
      VALUES ?type {{ wd:Q1190554 wd:Q198 wd:Q178 wd:Q131967 wd:Q1023929 wd:Q4830453 }}
      
      ?item wdt:P31/wdt:P279* ?type .
      ?item wdt:P30 wd:{continent_id} .
      ?item wdt:P585 ?date .
      ?item wdt:P625 ?coord .

      OPTIONAL {{ ?article schema:about ?item ; schema:inLanguage "pt" ; schema:isPartOf <https://pt.wikipedia.org/> . }}
      OPTIONAL {{ ?article schema:about ?item ; schema:inLanguage "en" ; schema:isPartOf <https://en.wikipedia.org/> . }}

      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "pt,en". }}
    }}
    ORDER BY DESC(?date)
    LIMIT {limit}
    """
    
    try:
        process_query_results(query, continent_name, status_callback)
    except Exception as e:
        print(f"Erro Turbo em {continent_name}: {e}")

# ==============================================================================
# 🌍 MODO VARREDURA/DETALHADO (Busca por Coordenada e Data Recursiva)
# ==============================================================================
def fetch_recursive(region_name, box, start_year, end_year, limit=50, status_callback=None, depth=0):
    # Condição de parada para não ficar infinito
    if (end_year - start_year) < 5: return

    lon_sw, lat_sw, lon_ne, lat_ne = box
    start_date = f"{start_year}-01-01T00:00:00Z"
    end_date = f"{end_year}-12-31T23:59:59Z"
    
    if depth == 0 and status_callback:
        status_callback(f"🔍 Varredura: {region_name} ({start_year} a {end_year})...")

    # Query Espacial
    query = f"""
    SELECT DISTINCT ?item ?itemLabel ?itemDescription ?date ?coord ?article WHERE {{
      SERVICE wikibase:box {{
         ?item wdt:P625 ?coord .
         bd:serviceParam wikibase:cornerSouthWest "Point({lon_sw} {lat_sw})"^^geo:wktLiteral .
         bd:serviceParam wikibase:cornerNorthEast "Point({lon_ne} {lat_ne})"^^geo:wktLiteral .
      }}
      
      # Qualquer coisa que seja subtipo de Evento Histórico
      ?item wdt:P31/wdt:P279* wd:Q1190554 . 
      
      OPTIONAL {{ ?article schema:about ?item ; schema:inLanguage "pt" ; schema:isPartOf <https://pt.wikipedia.org/> . }}
      OPTIONAL {{ ?article schema:about ?item ; schema:inLanguage "en" ; schema:isPartOf <https://en.wikipedia.org/> . }}
      
      ?item wdt:P585 ?date .
      FILTER(?date >= "{start_date}"^^xsd:dateTime && ?date <= "{end_date}"^^xsd:dateTime)
      
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "pt,en". }}
    }}
    LIMIT {limit}
    """
    
    try:
        # Se a query falhar ou retornar MAX resultados (significa que tem mais coisas nesse período), dividimos o tempo
        has_results, count = process_query_results(query, region_name, None) # Passa None no callback pra não spammar
        
        # Se encheu o limite (50), divide o tempo em dois e tenta de novo (Recursividade)
        if count >= limit:
            time.sleep(1)
            mid = (start_year + end_year) // 2
            fetch_recursive(region_name, box, start_year, mid, limit, status_callback, depth + 1)
            fetch_recursive(region_name, box, mid + 1, end_year, limit, status_callback, depth + 1)
            
    except: pass

# ==============================================================================
# PROCESSADOR COMUM (Evita duplicar código)
# ==============================================================================
def process_query_results(query, region_name, status_callback):
    r = requests.get(WIKIDATA_URL, params={'query': query, 'format': 'json'}, headers=HEADERS, timeout=45)
    
    if r.status_code == 200:
        items = r.json()['results']['bindings']
        count = 0
        total = len(items)
        
        for i, item in enumerate(items):
            try:
                name = item.get("itemLabel", {}).get("value")
                if not name or (name.startswith("Q") and any(c.isdigit() for c in name)): continue
                
                date_str = item.get("date", {}).get("value", "")
                coord_str = item.get("coord", {}).get("value", "")
                article_url = item.get("article", {}).get("value", "")
                
                if not date_str or not coord_str: continue
                
                year = int(date_str[0:5]) if date_str.startswith('-') else int(date_str[0:4])
                c_raw = coord_str.replace("Point(", "").replace(")", "").split(" ")
                
                # Busca texto
                full_content = None
                if article_url:
                    # Só busca texto se tiver status_callback (Modo Turbo) ou aleatoriamente para não travar Varredura
                    if status_callback and i % 15 == 0: 
                        status_callback(f"🌍 {region_name}: Processando {i}/{total}...")
                    
                    if "guerra" in name.lower() or "batalha" in name.lower() or "revolução" in name.lower() or status_callback:
                         full_content = get_wiki_summary(article_url)

                payload = {
                    "name": str(name),
                    "description": str(item.get("itemDescription", {}).get("value", "Evento Histórico")),
                    "content": full_content,
                    "year_start": int(year),
                    "year_end": int(year),
                    "latitude": float(c_raw[1]),
                    "longitude": float(c_raw[0]),
                    "continent": region_name,
                    "period": determine_period(year),
                    "is_manual": False
                }
                requests.post(API_URL, json=payload)
                count += 1
            except: continue
        
        if status_callback: status_callback(f"✅ {region_name}: +{count} eventos.")
        return True, count
    return False, 0

# ==============================================================================
# PONTOS DE ENTRADA (Chamados pelo main.py)
# ==============================================================================

def run_fast_mode(status_callback=None):
    populate_from_json_file(status_callback)
    for cid, cname in CONTINENT_IDS:
        fetch_massive_fast(cid, cname, status_callback)
        time.sleep(2)

def run_detailed_mode(status_callback=None):
    populate_from_json_file(status_callback)
    # Períodos Chave para Varredura
    periods = [(-3000, -1), (1, 1500), (1501, 1900), (1901, 2025)]
    
    total_steps = len(CONTINENT_BOXES) * len(periods)
    step = 0
    
    for name, lon_sw, lat_sw, lon_ne, lat_ne in CONTINENT_BOXES:
        for start, end in periods:
            step += 1
            if status_callback:
                pct = int((step/total_steps)*100)
                status_callback(f"🌍 Varredura {pct}%: {name} ({start} a {end})")
            
            fetch_recursive(name, (lon_sw, lat_sw, lon_ne, lat_ne), start, end, 50, status_callback)
            time.sleep(1)