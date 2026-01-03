import requests
import time
import json
import os
import re

API_URL = "http://localhost:8000/events"
WIKIDATA_URL = "https://query.wikidata.org/sparql"

HEADERS = {
    "User-Agent": "AtlasHistoricoBot/15.0 (Full Content Mode)",
    "Accept": "application/json"
}

# Mapa de Continentes para IDs
CONTINENT_MAP = {
    "América do Sul": "Q18",
    "Europa": "Q46",
    "América do Norte": "Q49",
    "África": "Q15",
    "Ásia": "Q48",
    "Oceania": "Q538",
    "Antártida": "Q51"
}

def determine_period(year):
    if year < -4000: return "Pré-História"
    if year < 476: return "Idade Antiga"
    if year < 1453: return "Idade Média"
    if year < 1789: return "Idade Moderna"
    return "Idade Contemporânea"

def get_wiki_summary(article_url):
    """
    Busca o resumo introdutório da Wikipédia.
    Nota: A API 'summary' traz o primeiro parágrafo (intro), que geralmente é
    o ideal para um popup de mapa. Trazer o artigo inteiro HTML quebraria o layout.
    """
    if not article_url: return None
    try:
        # Pega o slug do título (ex: Guerra_dos_Farrapos)
        title = article_url.split("/wiki/")[-1]
        
        # Detecta idioma
        lang = "pt" if "pt.wikipedia" in article_url else "en"
        
        # Endpoint oficial de resumo
        api_url = f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{title}"
        
        r = requests.get(api_url, headers=HEADERS, timeout=4) # Aumentei timeout pra 4s
        if r.status_code == 200:
            data = r.json()
            # extract = Texto puro | description = Subtítulo curto
            return data.get("extract") 
    except Exception as e:
        print(f"Erro Wiki ({article_url}): {e}")
        return None
    return None

def populate_from_json_file(status_callback=None):
    if status_callback: status_callback("📂 Inserindo dados manuais (JSON)...")
    file_path = os.path.join(os.path.dirname(__file__), "manual_events.json")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            manual_events = json.load(f)
        for evt in manual_events:
            try:
                # Garante que o manual não seja apagável pelo processo de limpeza
                evt['is_manual'] = False 
                evt['period'] = determine_period(int(evt["year_start"]))
                requests.post(API_URL, json=evt)
            except: pass
    except: pass

# ==============================================================================
# PROCESSADOR DE QUERY
# ==============================================================================
def process_query_results(query, region_name, status_callback):
    try:
        # Timeout alto no request do SPARQL pois a query é pesada
        r = requests.get(WIKIDATA_URL, params={'query': query, 'format': 'json'}, headers=HEADERS, timeout=90)
        
        if r.status_code == 200:
            items = r.json()['results']['bindings']
            total = len(items)
            count = 0
            
            if total == 0:
                print(f"⚠️ Zero resultados para {region_name}.")
            
            for i, item in enumerate(items):
                try:
                    name = item.get("itemLabel", {}).get("value")
                    
                    # --- FILTROS DE SEGURANÇA ---
                    if not name: continue
                    # Filtra IDs técnicos (Q12345) que vem sem label
                    if name.startswith("Q") and any(c.isdigit() for c in name) and " " not in name: continue
                    # Anti-Eclipse (Redundância)
                    if "eclipse" in name.lower(): continue
                    
                    date_str = item.get("date", {}).get("value", "")
                    coord_str = item.get("coord", {}).get("value", "")
                    article_url = item.get("article", {}).get("value", "")
                    
                    if not date_str or not coord_str: continue
                    
                    year = int(date_str[0:5]) if date_str.startswith('-') else int(date_str[0:4])
                    c_raw = coord_str.replace("Point(", "").replace(")", "").split(" ")
                    
                    # --- BUSCA DE CONTEÚDO (CORRIGIDO) ---
                    full_content = None
                    
                    # Atualiza status visual a cada 10 itens
                    if status_callback and i % 10 == 0:
                         status_callback(f"🌍 {region_name}: Processando {i}/{total}...")
                    
                    # AGORA: Se tem link, busca o conteúdo. Sem filtros de keywords.
                    if article_url:
                        full_content = get_wiki_summary(article_url)
                        # Pequena pausa para não tomar block da Wikipedia API (Rate Limit)
                        time.sleep(0.15) 

                    # Se não veio conteúdo da Wiki, usa a descrição curta do Wikidata como fallback
                    desc = item.get("itemDescription", {}).get("value", "Evento Histórico")
                    
                    payload = {
                        "name": str(name),
                        "description": str(desc),
                        "content": full_content if full_content else desc, # Garante que content nunca vá vazio se possível
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
                except Exception as e: 
                    # print(f"Erro item: {e}")
                    continue
            
            if status_callback: status_callback(f"✅ {region_name}: +{count} eventos inseridos.")
            return True, count
        else:
            print(f"Erro Wikidata Status: {r.status_code}")
    except Exception as e:
        print(f"Erro request SPARQL: {e}")
    return False, 0

# ==============================================================================
# MODO TURBO (FILTRÁVEL)
# ==============================================================================
def run_fast_mode(status_callback, target_continents, start_year, end_year):
    # Primeiro carrega os manuais para garantir
    populate_from_json_file(status_callback)
    
    selected_ids = [ (cid, name) for name, cid in CONTINENT_MAP.items() if name in target_continents ]
    
    if not selected_ids:
        if status_callback: status_callback("⚠️ Nenhum continente selecionado!")
        return

    for continent_id, continent_name in selected_ids:
        if status_callback: status_callback(f"🚀 Iniciando busca em {continent_name}...")
        
        # QUERY SPARQL SUPER TUNADA
        # Adicionei muito mais IDs de tipos para pegar Farrapos (Rebelião), Golpes, etc.
        query = f"""
        SELECT DISTINCT ?item ?itemLabel ?itemDescription ?date ?coord ?article WHERE {{
          
          # LISTA EXPANDIDA DE TIPOS:
          # Q1190554 (Evento Histórico), Q198 (Guerra), Q178 (Batalha), Q131967 (Tratado)
          # Q1023929 (Revolução), Q124734 (Rebelião/Insurreição), Q40231 (Eleição importante)
          # Q132821 (Assassinato), Q350604 (Campanha Militar), Q6534 (Golpe de Estado)
          VALUES ?type {{ 
            wd:Q1190554 wd:Q198 wd:Q178 wd:Q131967 wd:Q1023929 
            wd:Q124734 wd:Q40231 wd:Q132821 wd:Q350604 wd:Q6534
          }}
          
          ?item wdt:P31/wdt:P279* ?type .     # É um desses tipos
          ?item wdt:P30 wd:{continent_id} .   # É no continente X
          ?item wdt:P585 ?date .              # Tem data
          ?item wdt:P625 ?coord .             # Tem coordenada

          # Filtro de Data
          FILTER(YEAR(?date) >= {start_year} && YEAR(?date) <= {end_year})

          # Anti-Eclipse (Usando MINUS com classes é mais rápido que REGEX)
          MINUS {{ ?item wdt:P31/wdt:P279* wd:Q3863 . }} 
          MINUS {{ ?item wdt:P31/wdt:P279* wd:Q44235 . }}

          # Tenta pegar artigo em PT, se não der pega em EN
          OPTIONAL {{ ?article schema:about ?item ; schema:inLanguage "pt" ; schema:isPartOf <https://pt.wikipedia.org/> . }}
          OPTIONAL {{ ?article schema:about ?item ; schema:inLanguage "en" ; schema:isPartOf <https://en.wikipedia.org/> . }}

          SERVICE wikibase:label {{ bd:serviceParam wikibase:language "pt,en". }}
        }}
        ORDER BY DESC(?date)
        LIMIT 3500
        """
        
        process_query_results(query, continent_name, status_callback)
        
        # Pausa para respirar entre continentes
        time.sleep(2)

def run_detailed_mode(status_callback, target_continents, start_year, end_year):
    # Por enquanto usa o mesmo do Turbo pois ficou muito bom
    run_fast_mode(status_callback, target_continents, start_year, end_year)