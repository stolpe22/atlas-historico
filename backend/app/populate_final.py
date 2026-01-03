import requests
import sys
import time
import json
import os

# Configurações
API_URL = "http://localhost:8000/events"
WIKIDATA_URL = "https://query.wikidata.org/sparql"

HEADERS = {
    "User-Agent": "AtlasHistoricoBot/7.0 (Recursive)",
    "Accept": "application/json"
}

# --- CAIXAS GEOGRÁFICAS ---
CONTINENT_BOXES = [
    ("América do Sul", -81.0, -56.0, -34.0, 13.0),
    ("Europa", -10.0, 36.0, 40.0, 70.0),
    ("América do Norte", -160.0, 15.0, -50.0, 72.0),
    ("Ásia", 40.0, 10.0, 140.0, 55.0),
    ("África", -18.0, -35.0, 52.0, 37.0)
]

# --- LÓGICA DE PERÍODOS HISTÓRICOS ---
def determine_period(year):
    if year < -4000: return "Pré-História"
    if year < 476: return "Idade Antiga"
    if year < 1453: return "Idade Média"
    if year < 1789: return "Idade Moderna"
    return "Idade Contemporânea"

# --- 1. POPULAÇÃO VIA ARQUIVO JSON ---
def populate_from_json_file(status_callback=None):
    msg = "📂 Lendo arquivo manual..."
    print(msg)
    if status_callback: status_callback(msg)
    
    file_path = os.path.join(os.path.dirname(__file__), "manual_events.json")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            manual_events = json.load(f)
        created = 0
        for evt in manual_events:
            try:
                requests.post(API_URL, json={
                    "name": evt["name"],
                    "description": evt["description"],
                    "year_start": evt["year_start"],
                    "year_end": evt.get("year_end"),
                    "latitude": evt["latitude"],
                    "longitude": evt["longitude"],
                    "continent": evt["continent"],
                    "period": determine_period(evt["year_start"])
                })
                created += 1
            except: pass
        print(f"✅ JSON Local: {created} novos inseridos.")
    except: pass

# --- 2. BUSCA GEESPACIAL RECURSIVA ---
def fetch_recursive(region_name, box, start_year, end_year, limit=50, status_callback=None, depth=0):
    # Condição de parada: Se o intervalo for menor que 5 anos, desiste para não loopar infinito
    if (end_year - start_year) < 5:
        print(f"   ⚠️ Intervalo muito pequeno ({start_year}-{end_year}), pulando.")
        return

    lon_sw, lat_sw, lon_ne, lat_ne = box
    
    # Formatação visual da recursão
    indent = "   " + ("  " * depth)
    msg = f"{indent}📅 {region_name}: {start_year} a {end_year}..."
    print(msg, end="")
    sys.stdout.flush()
    if status_callback and depth == 0: # Só avisa o front nos níveis macro
        status_callback(msg.strip())

    start_date = f"{start_year}-01-01T00:00:00Z"
    end_date = f"{end_year}-12-31T23:59:59Z"

    query = f"""
    SELECT DISTINCT ?itemLabel ?itemDescription ?date ?coord WHERE {{
      SERVICE wikibase:box {{
         ?item wdt:P625 ?coord .
         bd:serviceParam wikibase:cornerSouthWest "Point({lon_sw} {lat_sw})"^^geo:wktLiteral .
         bd:serviceParam wikibase:cornerNorthEast "Point({lon_ne} {lat_ne})"^^geo:wktLiteral .
      }}
      ?item wdt:P31/wdt:P279* wd:Q1190554 . 
      
      # BLACKLIST (Sem Eclipses)
      MINUS {{ ?item wdt:P31/wdt:P279* wd:Q11348 . }}
      MINUS {{ ?item wdt:P31/wdt:P279* wd:Q164548 . }}
      MINUS {{ ?item wdt:P31/wdt:P279* wd:Q614532 . }}

      ?item wdt:P585 ?date .
      FILTER(?date >= "{start_date}"^^xsd:dateTime && ?date <= "{end_date}"^^xsd:dateTime)
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "pt,en". }}
    }}
    LIMIT {limit}
    """
    
    success = False
    data = []

    try:
        r = requests.get(WIKIDATA_URL, params={'query': query, 'format': 'json'}, headers=HEADERS, timeout=45)
        if r.status_code == 200:
            data = r.json()['results']['bindings']
            success = True
        elif r.status_code == 429:
            print(" ⏳ (429 Rate Limit - Esperando 5s)")
            time.sleep(5)
            # Tenta de novo recursivo (mesmos parametros)
            fetch_recursive(region_name, box, start_year, end_year, limit, status_callback, depth)
            return
    except Exception:
        pass

    # SE DEU ERRO OU TIMEOUT -> DIVIDE E CONQUISTA
    if not success:
        print(" ❌ Timeout! Dividindo em 2...")
        mid = (start_year + end_year) // 2
        # Chama a si mesmo para a primeira metade
        fetch_recursive(region_name, box, start_year, mid, limit, status_callback, depth + 1)
        # Chama a si mesmo para a segunda metade
        fetch_recursive(region_name, box, mid + 1, end_year, limit, status_callback, depth + 1)
        return

    # SE DEU CERTO -> PROCESSA
    created = 0
    if not data:
        print(" (0 itens)")
        return

    for item in data:
        try:
            name = item.get("itemLabel", {}).get("value")
            if "eclipse" in name.lower(): continue
            if name.startswith("Q") and any(c.isdigit() for c in name): continue

            desc = item.get("itemDescription", {}).get("value", "Evento Histórico")
            date_str = item.get("date", {}).get("value", "")
            coord_str = item.get("coord", {}).get("value", "")
            
            if not date_str or not coord_str: continue
            
            year = int(date_str[0:5]) if date_str.startswith('-') else int(date_str[0:4])
            c_raw = coord_str.replace("Point(", "").replace(")", "").split(" ")
            
            requests.post(API_URL, json={
                "name": name,
                "description": desc,
                "year_start": year,
                "year_end": year,
                "latitude": float(c_raw[1]),
                "longitude": float(c_raw[0]),
                "continent": region_name,
                "period": determine_period(year)
            })
            created += 1
        except: continue
    
    print(f" -> {created} novos.")

# --- 3. ORQUESTRADOR ---
def populate_manual(status_callback=None):
    populate_from_json_file(status_callback)
    
    # Fatias Iniciais (Otimistas)
    # Se falhar, o script divide sozinho.
    periods = [
        (-3000, -1),    # Antiguidade inteira
        (1, 1500),      # Até fim da Idade Média
        (1501, 1800),   # Idade Moderna
        (1801, 1900),   # Século XIX
        (1901, 1950),   # Guerras
        (1951, 2024)    # Contemporâneo
    ]
    
    total = len(CONTINENT_BOXES) * len(periods)
    step = 0

    for name, lon_sw, lat_sw, lon_ne, lat_ne in CONTINENT_BOXES:
        box = (lon_sw, lat_sw, lon_ne, lat_ne)
        for start, end in periods:
            step += 1
            if status_callback:
                pct = int((step/total)*100)
                status_callback(f"🌍 {name} ({start}-{end}) - {pct}%")
            
            fetch_recursive(name, box, start, end, limit=40, status_callback=status_callback)
            time.sleep(2)

    if status_callback: status_callback("✅ Processo Finalizado!")

if __name__ == "__main__":
    populate_manual()