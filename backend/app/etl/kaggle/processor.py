import random
from sqlalchemy.orm import Session
from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter
from app.models import KaggleStaging, HistoricalEvent, EventSource

def process_staging_to_events(db: Session, dataset_id: int, limit: int = 2000, log_callback=None, stop_check_callback=None):
    
    def log(msg):
        print(msg)
        if log_callback: log_callback(msg)

    # Estatísticas iniciais
    total_rows = db.query(KaggleStaging).filter(KaggleStaging.dataset_id == dataset_id).count()
    rows = db.query(KaggleStaging).filter(
        KaggleStaging.dataset_id == dataset_id,
        KaggleStaging.processed == False
    ).limit(limit).all()

    if not rows:
        log("💤 Nada pendente para processar.")
        return 0

    log(f"▶️ Processando {len(rows)} registros via Nominatim (API)...")

    # Configura Geocoding Seguro (Rate Limit é essencial para não ser bloqueado)
    geolocator = Nominatim(user_agent="atlas_historico_clean_v1")
    # 1.1 segundos de delay entre chamadas é o "bom comportamento" exigido pelo OpenStreetMap
    geocode = RateLimiter(geolocator.geocode, min_delay_seconds=1.1)
    
    count = 0
    updated_count = 0
    created_count = 0

    for i, row in enumerate(rows):
        # 1. VERIFICAÇÃO DE PARADA (Botão Cancelar)
        if stop_check_callback and stop_check_callback():
            log("🛑 Processo interrompido pelo usuário.")
            db.commit()
            return count

        try:
            raw = row.data
            name = raw.get("Name of Incident") or raw.get("Event") or "Evento"
            
            # --- Limpeza de Ano ---
            year_raw = str(raw.get("Year", ""))
            year_clean = None
            if "BC" in year_raw.upper():
                clean = ''.join(filter(str.isdigit, year_raw))
                if clean: year_clean = -int(clean)
            elif year_raw.isdigit():
                year_clean = int(year_raw)
            
            if year_clean is None:
                row.processed = True
                continue

            # --- GEOLOCALIZAÇÃO (100% API) ---
            place_name = raw.get("Place Name", "").strip()
            country = raw.get("Country", "").strip()
            
            # Monta endereço: "Indus Valley, India"
            address = f"{place_name}, {country}".strip(", ")
            
            lat, lon = 0.0, 0.0
            
            # Só busca se tiver endereço válido
            if address and address.lower() not in ["unknown, unknown", "", "unknown"]:
                try:
                    # Timeout um pouco maior pois dependemos 100% da rede agora
                    loc = geocode(address) 
                    if loc:
                        lat, lon = loc.latitude, loc.longitude
                except Exception as e:
                    # Falha silenciosa de rede, segue com 0,0 ou tenta o próximo
                    pass
            
            # --- JITTER (Anti-Sobreposição) ---
            # Se achou coordenada, aplica um pequeno desvio aleatório (~1km)
            # Isso separa visualmente eventos que ocorreram na mesma cidade
            if lat != 0 and lon != 0:
                lat += random.uniform(-0.015, 0.015)
                lon += random.uniform(-0.015, 0.015)

            location_wkt = f"POINT({lon} {lat})"

            # --- FORMATAÇÃO DO CONTENT ---
            content_formatted = (
                f"Type Event: {raw.get('Type of Event', 'N/A')}\n\n"
                f"Impact: {raw.get('Impact', 'N/A')}\n\n"
                f"Affected Population: {raw.get('Affected Population', 'N/A')}\n\n"
                f"Important Person/Group Responsible: {raw.get('Important Person/Group Responsible', 'N/A')}\n\n"
                f"Outcome: {raw.get('Outcome', 'N/A')}"
            )

            # --- UPSERT (Insert ou Update) ---
            existing_event = db.query(HistoricalEvent).filter(
                HistoricalEvent.name == name,
                HistoricalEvent.year_start == year_clean,
                HistoricalEvent.source == EventSource.KAGGLE
            ).first()

            if existing_event:
                existing_event.location = location_wkt
                existing_event.content = content_formatted
                existing_event.description = raw.get("Impact", "")[:990]
                updated_count += 1
                action_icon = "🔄"
            else:
                new_event = HistoricalEvent(
                    name=name,
                    description=raw.get("Impact", "")[:990],
                    content=content_formatted,
                    year_start=year_clean,
                    year_end=year_clean,
                    continent="Desconhecido",
                    location=location_wkt,
                    source=EventSource.KAGGLE,
                    period="Kaggle Import"
                )
                db.add(new_event)
                created_count += 1
                action_icon = "✅"

            row.processed = True
            count += 1
            
            # Log para o Front
            coords_str = f"({lat:.2f}, {lon:.2f})" if lat != 0 else "(Não achou)"
            log(f"{action_icon} [{count}/{len(rows)}] {name} -> {address} {coords_str}")

            # Commit parcial (Pingando no mapa) a cada 5 registros
            if count % 5 == 0:
                db.commit()

        except Exception as e:
            row.error_msg = str(e)
            log(f"❌ Erro: {e}")

    # Commit final
    db.commit()
    log(f"🏁 Finalizado! Criados: {created_count}, Atualizados: {updated_count}.")
    return count