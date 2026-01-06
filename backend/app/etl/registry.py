from .seed.adapter import SeedAdapter
from .kaggle.adapter import KaggleAdapter
from .wikidata.adapter import WikidataAdapter

# Mapa: Slug do Banco -> Classe Python
ADAPTERS = {
    "seed": SeedAdapter(),
    "kaggle": KaggleAdapter(),
    "wikidata": WikidataAdapter(),
    # Futuro: "openai": OpenAiAdapter(),
}

def get_adapter(slug: str):
    return ADAPTERS.get(slug)