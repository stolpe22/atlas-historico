import requests
import sys
import time

# URL da sua API Local
LOCAL_API_URL = "http://localhost:8000/events"

# URL da API da Wikidata (Onde vamos buscar a história real)
WIKIDATA_URL = "https://query.wikidata.org/sparql"

def fetch_historical_events():
    print("🌍 Conectando na Wikidata para baixar a história do mundo...")
    
    # Query SPARQL: Pede eventos (batalhas, tratados, etc) com data e coordenadas
    # P31 = Instancia de
    # Q198 = Guerra, Q178561 = Batalha, Q131967 = Tratado, etc.
    query = """
    SELECT DISTINCT ?item ?itemLabel ?itemDescription ?date ?coord WHERE {
      VALUES ?type { wd:Q178561 wd:Q131967 wd:Q1190554 wd:Q8066 wd:Q40231 }
      ?item wdt:P31 ?type;
            wdt:P585 ?date;
            wdt:P625 ?coord.
      
      SERVICE wikibase:label { bd:serviceParam wikibase:language "pt,en". }
    }
    ORDER BY ?date
    LIMIT 1200
    """
    
    # Headers são obrigatórios para a Wikidata não bloquear
    headers = {
        "User-Agent": "AtlasHistoricoBot/1.0 (seu_email@example.com)",
        "Accept": "application/json"
    }

    try:
        r = requests.get(WIKIDATA_URL, params={'query': query, 'format': 'json'}, headers=headers)
        r.raise_for_status()
        data = r.json()
        return data['results']['bindings']
    except Exception as e:
        print(f"❌ Erro ao baixar da Wikidata: {e}")
        return []

def parse_wikidata_point(wkt_str):
    # Formato Wikidata: "Point(-46.6 23.5)" -> retorna [lon, lat]
    clean = wkt_str.replace("Point(", "").replace(")", "")
    lon, lat = clean.split(" ")
    return float(lat), float(lon)

def parse_year(date_str):
    # Formato Wikidata: "1789-07-14T00:00:00Z" ou "-0044-03-15..."
    try:
        # Pega os primeiros 4 caracteres (ou 5 se tiver sinal de menos)
        if date_str.startswith("-"):
            return int(date_str[0:5]) # Ex: -0044
        return int(date_str[0:4])     # Ex: 1945
    except:
        return 0

def populate():
    events = fetch_historical_events()
    print(f"📚 {len(events)} eventos encontrados! Iniciando importação...")
    
    success_count = 0
    
    for i, item in enumerate(events):
        try:
            # Extração de dados
            name = item.get("itemLabel", {}).get("value", "Evento Desconhecido")
            desc = item.get("itemDescription", {}).get("value", "Evento histórico importante.")
            date_str = item.get("date", {}).get("value", "")
            coord_str = item.get("coord", {}).get("value", "")
            
            lat, lon = parse_wikidata_point(coord_str)
            year = parse_year(date_str)
            
            # Monta o payload pro nosso Backend
            payload = {
                "name": name,
                "description": desc,
                "year_start": year,
                "year_end": year, # Eventos pontuais tem inicio=fim
                "latitude": lat,
                "longitude": lon
            }
            
            # Envia pro Backend
            response = requests.post(LOCAL_API_URL, json=payload)
            
            if response.status_code == 200:
                success_count += 1
                # Barra de progresso simples
                sys.stdout.write(f"\r✅ Importando: {success_count}/{len(events)} - {name[:30]}...")
                sys.stdout.flush()
            
        except Exception as e:
            continue

    print(f"\n\n🏁 Importação finalizada! {success_count} eventos adicionados ao Atlas.")

if __name__ == "__main__":
    populate()