import requests

API_URL = "http://localhost:8000/events"
TARGET_NAME = "Queda de Roma"  # <--- O nome exato que você quer apagar

def delete_by_name():
    print(f"🔍 Procurando por: '{TARGET_NAME}'...")
    
    try:
        # 1. Busca todos os eventos para encontrar o ID correto
        response = requests.get(f"{API_URL}/all")
        events = response.json()
    except Exception as e:
        print(f"❌ Erro ao conectar na API: {e}")
        return

    # Filtra pelo nome exato
    found = [e for e in events if e['name'] == TARGET_NAME]

    if not found:
        print(f"⚠️ Nenhum evento encontrado com o nome '{TARGET_NAME}'.")
        return

    print(f"Encontrados {len(found)} registros. Iniciando remoção...")

    # 2. Deleta cada um que achou
    for event in found:
        try:
            r = requests.delete(f"{API_URL}/{event['id']}")
            if r.status_code == 200:
                print(f"✅ Deletado: ID {event['id']} | Ano: {event['year_start']} | Continente: {event.get('continent')}")
            else:
                print(f"❌ Erro ao deletar ID {event['id']}: {r.text}")
        except Exception as e:
            print(f"❌ Erro de conexão ao tentar deletar: {e}")

if __name__ == "__main__":
    delete_by_name()