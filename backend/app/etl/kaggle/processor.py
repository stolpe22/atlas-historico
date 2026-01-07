import random
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, text, and_
from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter
from ...models import KaggleStaging, HistoricalEvent, EventSource, GeonamesCity
from ...utils import calculate_period, get_continent_from_coords

def process_staging_to_events(db: Session, kaggle_id: str, limit: int = 2000, log_callback=None, stop_check_callback=None):
    
    def log(msg):
        print(msg)
        if log_callback: log_callback(msg)

    # 1. Carrega dados pendentes
    rows = db.query(KaggleStaging).filter(
        KaggleStaging.kaggle_id == kaggle_id,
        KaggleStaging.processed == False
    ).limit(limit).all()

    if not rows:
        log("💤 Nada pendente para processar.")
        return 0

    log(f"🚀 Iniciando processamento de {len(rows)} registros...")

    api_queue = [] 
    processed_count = 0

    # =========================================================================
    # FASE 1: RESOLUÇÃO LOCAL (DB) ⚡
    # =========================================================================
    log("🌍 [FASE 1] Buscando no DB Local (GeoNames)...")
    
    for row in rows:
        if stop_check_callback and stop_check_callback():
            log("🛑 Interrompido na Fase 1.")
            db.commit()
            return processed_count

        try:
            raw = row.raw_data
            place_name = raw.get("Place Name", "") or ""
            place_name = str(place_name).strip()
            country_name = raw.get("Country", "") or ""
            country_name = str(country_name).strip()
            
            if "," in place_name:
                place_name = place_name.split(",")[0].strip()

            lat, lon = 0.0, 0.0
            found_local = False
            match_type = ""

            if place_name and place_name.lower() not in ["unknown", ""]:
                # 1. Tentativa Perfeita: Cidade + País
                city_match = db.query(GeonamesCity).filter(
                    func.lower(GeonamesCity.asciiname) == place_name.lower(),
                    func.lower(GeonamesCity.country_name) == country_name.lower()
                ).order_by(desc(GeonamesCity.population)).first()

                if city_match:
                    lat, lon = city_match.latitude, city_match.longitude
                    match_type = "Cidade+País"
                    found_local = True

                # 2. Tentativa Relaxada: Só Cidade
                if not found_local:
                    city_match = db.query(GeonamesCity).filter(
                        func.lower(GeonamesCity.asciiname) == place_name.lower()
                    ).order_by(desc(GeonamesCity.population)).first()

                    if city_match:
                        lat, lon = city_match.latitude, city_match.longitude
                        match_type = "Só Cidade"
                        found_local = True

            # 3. Caso Especial: Place Name == Country
            if not found_local and country_name and (place_name.lower() == country_name.lower() or not place_name):
                 capital_match = db.query(GeonamesCity).filter(
                    func.lower(GeonamesCity.country_name) == country_name.lower()
                ).order_by(desc(GeonamesCity.population)).first()
                 
                 if capital_match:
                    lat, lon = capital_match.latitude, capital_match.longitude
                    match_type = "País (Capital)"
                    found_local = True

            if found_local:
                _save_event(db, row, lat, lon, f"🌍 DB ({match_type})", raw)
                processed_count += 1
                if processed_count % 100 == 0:
                    log(f"⚡ Processados {processed_count} localmente...")
            else:
                api_queue.append(row)

        except Exception as e:
            row.error_msg = str(e)
    
    db.commit()
    log(f"✅ FASE 1 Concluída. Fila API: {len(api_queue)}")

    # =========================================================================
    # FASE 2: FALLBACK API 🐢
    # =========================================================================
    if api_queue:
        log(f"☁️ [FASE 2] API Nominatim para {len(api_queue)} registros...")
        geolocator = Nominatim(user_agent="atlas_historico_v3")
        geocode = RateLimiter(geolocator.geocode, min_delay_seconds=1.1, max_retries=2)

        for i, row in enumerate(api_queue):
            if stop_check_callback and stop_check_callback():
                break

            try:
                raw = row.raw_data
                place_name = raw.get("Place Name", "") or ""
                country = raw.get("Country", "") or ""
                
                query = f"{place_name}, {country}"
                if str(place_name).lower() == str(country).lower():
                    query = country

                lat, lon = 0.0, 0.0
                geo_source = "N/A"

                if query.strip() and query.lower() not in ["unknown, unknown", "unknown"]:
                    try:
                        loc = geocode(query)
                        if loc:
                            lat, lon = loc.latitude, loc.longitude
                            geo_source = "☁️ Nominatim"
                    except Exception: pass
                
                _save_event(db, row, lat, lon, geo_source, raw)
                processed_count += 1
                
                if i % 10 == 0: 
                    log(f"🐢 Processando API: {i+1}/{len(api_queue)}")
                    db.commit()

            except Exception as e:
                row.error_msg = str(e)

    db.commit()
    log(f"🏁 Finalizado! Total: {processed_count}")
    return processed_count


def _save_event(db, row, lat, lon, source_label, raw):
    # Jitter para não sobrepor pontos no mesmo lugar
    if lat != 0 and lon != 0:
        lat += random.uniform(-0.01, 0.01)
        lon += random.uniform(-0.01, 0.01)
    
    # 🌟 AQUI ESTÁ A MÁGICA: Detecta continente pelo polígono
    detected_continent = get_continent_from_coords(db, lat, lon)
    
    location_wkt = f"POINT({lon} {lat})"
    name = raw.get("Name of Incident") or raw.get("Event") or "Evento Desconhecido"
    
    # Limpeza de Ano
    year_raw = str(raw.get("Year", ""))
    year_clean = None
    if "BC" in year_raw.upper():
        clean = ''.join(filter(str.isdigit, year_raw))
        if clean: year_clean = -int(clean)
    elif year_raw.replace('-','').isdigit():
        year_clean = int(year_raw)

    if year_clean is None:
        row.processed = True
        return

    period_val = calculate_period(year_clean)

    content_formatted = (
        f"Type Event: {raw.get('Type of Event', 'N/A')}\n\n"
        f"Impact: {raw.get('Impact', 'N/A')}\n\n"
        f"Outcome: {raw.get('Outcome', 'N/A')}"
    )

    # Verifica se já existe para evitar duplicatas (Upsert Manual)
    existing_event = db.query(HistoricalEvent).filter(
        HistoricalEvent.name == name,
        HistoricalEvent.year_start == year_clean
    ).first()

    if existing_event:
        existing_event.location = location_wkt
        existing_event.content = content_formatted
        existing_event.continent = detected_continent # Atualiza com o detectado
        existing_event.period = period_val
        row.processed = True
    else:
        new_event = HistoricalEvent(
            name=name,
            description=str(raw.get("Impact", ""))[:990],
            content=content_formatted,
            year_start=year_clean,
            year_end=year_clean,
            continent=detected_continent, # Usa o detectado pelo polígono!
            location=location_wkt,
            source=EventSource.KAGGLE,
            period=period_val
        )
        db.add(new_event)
        row.processed = True