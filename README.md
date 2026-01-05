# Atlas Histórico

Aplicação full-stack para explorar eventos históricos em mapa e lista, com criação manual, importação por ETL (seed local e integrações), e tradução on-demand no modal de eventos (LibreTranslate).

---

## Índice
- [Arquitetura](#arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Como iniciar](#como-iniciar)
  - [Com Docker Compose (recomendado)](#com-docker-compose-recomendado)
  - [Usando o script `run.sh`](#usando-o-script-runsh)
  - [Rodando local sem Docker (dev rápido)](#rodando-local-sem-docker-dev-rápido)
- [URLs úteis](#urls-úteis)
- [Serviços e variáveis](#serviços-e-variáveis)
  - [Postgres/PostGIS](#postgrespostgis)
  - [Backend](#backend)
  - [Frontend](#frontend)
  - [LibreTranslate](#libretranslate)
- [ETL, Seed e integrações](#etl-seed-e-integrações)
  - [Seeder de integrações (`seeder.py`)](#seeder-de-integrações-seederpy)
  - [Seed local de eventos (`manual_events.json`)](#seed-local-de-eventos-manual_eventsjson)
  - [Integrações Kaggle / OpenAI](#integrações-kaggle--openai)
  - [Wikidata / Gerador](#wikidata--gerador)
- [Tradução no modal de eventos](#tradução-no-modal-de-eventos)
- [Fluxo de uso na UI](#fluxo-de-uso-na-ui)
- [Estrutura de pastas](#estrutura-de-pastas)
  - [Frontend](#frontend-1)
  - [Backend](#backend-1)
- [Resolução de problemas](#resolução-de-problemas)
- [Referência rápida de comandos](#referência-rápida-de-comandos)

---

## Arquitetura
- **frontend** (React + Vite) servindo SPA em `http://localhost:3000`.
- **backend** (FastAPI) exposto em `http://localhost:8000`.
- **db**: Postgres + PostGIS.
- **libretranslate**: serviço local de tradução EN/PT em `http://localhost:5000`.

---

## Pré-requisitos
- Docker e Docker Compose v3.8+.
- Portas livres: 3000 (frontend), 8000 (backend), 5000 (tradução), 5434 (exposição do Postgres no host).

---

## Como iniciar

### Com Docker Compose (recomendado)
```bash
docker compose up -d --build
```
Isso sobe: db, backend, frontend e libretranslate.

### Usando o script `run.sh`
```bash
chmod +x run.sh
./run.sh
```
O script chama `docker compose up -d --build`, aguarda e exibe URLs:
- Frontend: http://localhost:3000
- Backend Docs: http://localhost:8000/docs
- LibreTranslate: http://localhost:5000

### Rodando local sem Docker (dev rápido)
1) **DB**: suba Postgres/PostGIS (pode usar o serviço do compose apenas para o db).
2) **Backend**:
   ```bash
   cd backend
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   export DB_HOST=localhost DB_PORT=5434 DB_NAME=history_atlas DB_USER=admin DB_PASSWORD=admin
   uvicorn app.main:app --reload --port 8000
   ```
3) **Frontend**:
   ```bash
   cd frontend
   npm install
   # opcional: export VITE_API_URL=http://localhost:8000
   # opcional: export VITE_TRANSLATE_URL=http://localhost:5000
   npm run dev -- --host --port 3000
   ```

---

## URLs úteis
- Frontend (Mapa Interativo): http://localhost:3000
- Backend (Swagger): http://localhost:8000/docs
- LibreTranslate (EN/PT): http://localhost:5000

---

## Serviços e variáveis

### Postgres/PostGIS
- Imagem: `postgis/postgis:16-3.4`
- Host (na rede docker): `db:5432`
- Host (no seu PC): `localhost:5434`
- Credenciais: user `admin`, senha `admin`, db `history_atlas`.

### Backend
- Porta: `8000:8000`
- Variáveis (compose):
  - `DB_HOST=db`
  - `DB_PORT=5432`
  - `DB_NAME=history_atlas`
  - `DB_USER=admin`
  - `DB_PASSWORD=admin`

### Frontend
- Build args (compose):
  - `VITE_API_URL=http://localhost:8000`
- Para tradução:
  - `VITE_TRANSLATE_URL=http://localhost:5000` (defina no `.env` ou no build arg do Dockerfile, se quiser).

### LibreTranslate
- Imagem: `libretranslate/libretranslate:latest`
- Porta: `5000:5000`
- Idiomas carregados: `LT_LOAD_ONLY=en,pt`
- Endpoint: `POST /translate` com body `{ q, source, target, format: "text" }`.

---

## ETL, Seed e integrações

### Seeder de integrações (`seeder.py`)
Arquivo: `backend/app/etl/integrations/seeder.py`.

O que faz:
- Povoa a tabela de integrações suportadas pelo sistema.
- Define `slug`, `name`, `description`, `logo_url` e `form_schema` (campos que a UI pedirá no modal).
- Atualiza `form_schema`/`name` se a integração já existir.

Integrações pré-definidas:
- **kaggle**
  - Descrição: Importação de datasets históricos massivos.
  - Campo exigido: `api_key` (password, placeholder `KGAT_...`).
- **openai**
  - Descrição: Enriquecimento de dados com IA.
  - Campo exigido: `api_key` (password, placeholder `sk-...`).

### Seed local de eventos (`manual_events.json`)
- Local: `backend/data/manual_events.json`.
- Disparo: UI → Sidebar → “Obter Dados” → “Restaurar Local”.
- Restaura um conjunto base de eventos (com coordenadas) no banco.

### Integrações Kaggle / OpenAI
- Configuradas via `seeder.py` e exibidas nos modais de ETL.
- Campos solicitados seguem o `form_schema`.
- Dependem das chaves fornecidas pelo usuário (ex.: Kaggle API Token, OpenAI API Key).

### Wikidata / Gerador
- Suporte a importação via Wikidata (ver `app/services/wikidata_service.py`, `etl/wikidata`).
- Pode envolver geocodificação remota; em lotes grandes, espere mais latência.

---

## Tradução no modal de eventos
- Botões: **Original** e **PT** (toggle).
- Tradução de nome/descrição/conteúdo usando LibreTranslate, cacheada em `localStorage` por `event_id`.
- Indicador sutil “PT” ao lado do título quando a versão traduzida está ativa.
- Tradução é apenas no modal; não há tradução global do mapa/lista para evitar travamentos.

---

## Fluxo de uso na UI
1) **Primeira vez**: abra `Settings` (ou “Configurações”) e carregue/atualize integrações.  
   - Se desejar Kaggle, insira o API Token (campo `api_key`).  
   - Se não configurar integrações, você ainda pode usar o seed local JSON.
2) Na Sidebar, vá em **Obter Dados**:
   - **Restaurar Local**: carrega `manual_events.json`.
   - **Gerador (Wikidata)**: importação online (se configurada).
3) Troque entre **Mapa** e **Lista** no topo da UI.
4) Clique em um evento para abrir o modal:
   - Botões **Original** / **PT** para alternar tradução.
5) Criação manual:
   - Use o FAB “+” ou clique no mapa (modo adicionar) para definir coordenadas e abrir o modal de criação.
6) Exclusão:
   - Só eventos `source=manual` podem ser removidos (o backend bloqueia outros).
7) Integrações:
   - Via modais de ETL; os campos exigidos vêm do `form_schema` (ex.: Kaggle/OpenAI).

---

## Estrutura de pastas

### Frontend
```
frontend/
|-- components
|   |-- common
|   |   |-- PopulateIndicator.jsx
|   |   |-- SourceBadge.jsx
|   |-- layout
|   |   |-- AppNavigation.jsx
|   |   |-- Header.jsx
|   |   |-- NavButton.jsx
|   |   |-- Sidebar.jsx
|   |-- list
|   |   |-- ListView.jsx
|   |-- map
|   |   |-- FlyTo.jsx
|   |   |-- MainMap.jsx
|   |   |-- MapController.jsx
|   |   |-- MapFix.jsx
|   |-- modals
|       |-- ConfirmModal.jsx
|       |-- ETLModal.jsx
|       |-- EventModal.jsx
|       |-- GlobalETLModal.jsx
|       |-- KaggleModal.jsx
|       |-- MinimizableModal.jsx
|       |-- NotificationModal.jsx
|       |-- PopulateModal.jsx
|       |-- SupportModals.jsx
|-- context
|   |-- ETLContext.jsx
|   |-- ToastContext.jsx
|-- hooks
|   |-- useEventForm.js
|   |-- useEvents.js
|   |-- usePopulate.js
|   |-- useTheme.js
|-- pages
|   |-- MainPage.jsx
|   |-- SettingsPage.jsx
|-- services
|   |-- api.js
|-- utils
|   |-- constants.js
|   |-- formatters.js
|   |-- mapHelpers.js
|-- App.jsx
|-- main.jsx
|-- useTheme.jsx
```

### Backend
```
backend/
|-- app
|   |-- etl
|   |   |-- geonames/
|   |   |-- integrations/
|   |   |   |-- seeder.py
|   |   |-- kaggle/
|   |   |-- wikidata/
|   |   |-- base.py
|   |   |-- registry.py
|   |-- models/
|   |-- routes/
|   |-- services/
|   |-- utils/
|   |-- config.py
|   |-- database.py
|   |-- main.py
|   |-- schemas.py
|-- data
|   |-- manual_events.json
|-- scripts
|   |-- delete_specific.py
|   |-- populate_massive.py
```

---

## Resolução de problemas
- **Mapa sem pontos / lista vazia**: verifique se seed rodou ou se a integração importou eventos; confirme latitude/longitude nos registros.
- **Tradução não funciona**: valide `libretranslate` em `http://localhost:5000` e `VITE_TRANSLATE_URL` no frontend.
- **Conflito de portas**: ajuste no `docker-compose.yml` ou libere 3000/8000/5000/5434.
- **Compose falhou**: `docker compose logs -f` para inspecionar backend/db; veja healthcheck do Postgres.
- **ETL lento**: importações Wikidata/geo podem demorar em grandes lotes; monitore modais de população e logs do backend.

---

## Referência rápida de comandos
- Subir tudo: `docker compose up -d --build`
- Parar tudo: `docker compose down`
- Logs: `docker compose logs -f`
- Rebuild só frontend: `docker compose build frontend && docker compose up -d frontend`
- Script helper: `./run.sh`