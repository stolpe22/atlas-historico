from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Configurações da aplicação carregadas de variáveis de ambiente."""
    
    # Database
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "history_atlas"
    db_user: str = "admin"
    db_password: str = "admin"
    
    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = False
    
    # Wikidata
    wikidata_url: str = "https://query.wikidata.org/sparql"
    wikidata_timeout: int = 120
    wikidata_delay: float = 0.5
    
    # Population
    year_tolerance: int = 2
    query_step_years: int = 10
    query_limit: int = 500

    @property
    def database_url(self) -> str:
        return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Retorna instância cacheada das configurações."""
    return Settings()