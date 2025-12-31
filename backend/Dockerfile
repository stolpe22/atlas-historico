# Usa Python 3.10 Slim como base
FROM python:3.10-slim

# 1. Instala o UV copiando da imagem oficial (Método mais seguro e rápido)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Configurações do Python e UV
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR /app

# 2. Instala dependências do SO (PostgreSQL/PostGIS precisa do libpq-dev)
RUN apt-get update && apt-get install -y \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# 3. Copia os arquivos de definição do UV
# Se você tiver 'pyproject.toml' e 'uv.lock', ele usa.
# Se você só tiver 'requirements.txt', podemos adaptar, mas assumindo UV Project:
COPY pyproject.toml uv.lock ./

# 4. Instala as dependências
# --frozen: Garante que usa as versões exatas do uv.lock
# --no-install-project: Instala só as libs, não o seu código (cache otimizado)
RUN uv sync --frozen --no-install-project

# 5. Adiciona o ambiente virtual criado pelo UV ao PATH
# Isso faz com que 'python' e 'uvicorn' apontem para o venv automaticamente
ENV PATH="/app/.venv/bin:$PATH"

# 6. Copia o resto do código
COPY . .

# 7. Roda a aplicação
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]