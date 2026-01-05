from .kaggle.adapter import KaggleAdapter

# Mapa: Slug do Banco -> Classe Python
ADAPTERS = {
    "kaggle": KaggleAdapter(),
    # Futuro: "openai": OpenAiAdapter(),
    # Futuro: "wikidata": WikidataAdapter(),
}

def get_adapter(slug: str):
    return ADAPTERS.get(slug)