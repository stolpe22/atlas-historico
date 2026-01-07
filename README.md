# 🌍 Atlas Histórico

O Atlas Histórico é uma plataforma geográfica interativa de código aberto projetada para consolidar, visualizar e gerenciar cronologias históricas mundiais. Combinando o poder de bancos de dados geoespaciais com uma interface dinâmica, o projeto permite que usuários explorem eventos através do tempo e do espaço.

## 📖 Índice
- [Visão Geral e Propósito](#-visão-geral-e-propósito)
- [Arquitetura de Software](#-arquitetura-de-software)
  - [Frontend: Data-Driven Design](#frontend-data-driven-design)
  - [Backend: Motor de ETL Unificado](#backend-motor-de-etl-unificado)
- [Stack Tecnológica](#-stack-tecnológica)
- [Obter o Código](#-obter-o-código) <!-- antes de instalação -->
- [Instalação e Configuração](#-instalação-e-configuração)
  - [Via Docker (Recomendado)](#via-docker-recomendado)
  - [Execução Manual (Desenvolvimento)](#execução-manual-desenvolvimento)
- [Guia do Desenvolvedor: Expandindo o Projeto](#-guia-do-desenvolvedor-expandindo-o-projeto)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)

## 🎯 Visão Geral e Propósito
Muitos dados históricos estão dispersos em arquivos CSV, bancos de dados legados ou APIs complexas. O Atlas Histórico foi construído para resolver este problema, estabelecendo a infraestrutura fundamental de um Agregador Geográfico.

Embora o projeto esteja em estágio inicial de população — contando atualmente com uma base semente curada (presets locais) e capacidade de importação de datasets do Kaggle — sua arquitetura foi desenhada para escalar. A plataforma oferece uma interface unificada onde dados são normalizados e enriquecidos automaticamente. Diferente de mapas simples, o projeto utiliza inteligência espacial para deduzir informações geográficas (como continentes) a partir de coordenadas puras, preenchendo lacunas comuns em datasets brutos e preparando o terreno para integrar fontes massivas como a Wikidata no futuro.

## 🏗️ Arquitetura de Software

### Frontend: Data-Driven Design
A interface não é apenas um conjunto de páginas, mas um sistema reativo que responde a metadados e gerencia processos complexos de longa duração.
- **Configuração via Constantes:** Os formulários de importação são gerados dinamicamente baseados na `ADAPTER_UI_CONFIG`. Adicionar um novo campo de input não requer alteração no JSX.
- **Gerenciamento de Estado Persistente (Multi-Tasking):** O `ETLContext` suporta múltiplas tarefas simultâneas. O estado de cada processo (Importação CSV, Sincronização GeoNames) é salvo no `localStorage`.
- **Resiliência ao Refresh (F5):** Se o usuário recarregar a página durante uma importação, o frontend recupera os `taskIds`, reconecta-se ao backend e retoma a exibição dos logs em tempo real sem perder o contexto.
- **Visualização de Alta Performance:** Implementação de Leaflet Marker Clustering com carregamento fragmentado, garantindo fluidez (60fps) no mapa.

### Backend: Motor de ETL Unificado
O backend utiliza o Registry Pattern para gerenciar integrações. Existe um endpoint mestre (`/etl/run`) que despacha comandos para adaptadores especializados.
- **Adaptadores Polimórficos:** A lógica de extração é isolada. Atualmente suporta Kaggle e Seed (JSON local), com estrutura pronta para implementação de novos robôs.
- **Geocoding & Geofencing (PostGIS):** O sistema utiliza a extensão espacial do PostgreSQL para realizar operações geométricas avançadas.
  - **Detecção Automática:** O sistema carrega multipolígonos de continentes (fonte: `hrbrmstr/continents.json`) e utiliza a função `ST_Intersects` para identificar automaticamente em qual continente um evento ocorreu, enriquecendo o dado bruto.
- **TaskManager Singleton:** Gerencia threads em background, permitindo logs granulares e cancelamento gracioso de tarefas.

## 🛠️ Stack Tecnológica

### Frontend
| Tecnologia              | Descrição                                                    |
|-------------------------|--------------------------------------------------------------|
| React 18 (Vite)         | Framework principal para SPA de alta performance.            |
| Tailwind CSS            | Estilização utilitária com suporte nativo a Dark Mode.       |
| Leaflet & React-Leaflet | Biblioteca de mapas open-source para renderização de clusters. |
| Lucide React            | Conjunto de ícones vetoriais modernos.                       |

### Backend
| Tecnologia               | Descrição                                                    |
|--------------------------|--------------------------------------------------------------|
| FastAPI                  | Framework Python assíncrono e tipado.                        |
| UV                       | Gerenciador de pacotes Python ultra-rápido (substituto do Pip). |
| SQLAlchemy 2.0           | ORM moderno para interação com o banco.                      |
| PostgreSQL 16 + PostGIS  | Banco de dados relacional com motor espacial SIG.            |

## 📥 Obter o Código
Repositório oficial: https://github.com/stolpe22/atlas-historico

- **Clonar via Git**
```bash
git clone https://github.com/stolpe22/atlas-historico.git
cd atlas-historico
```

- **Baixar ZIP**
  1) Acesse a página do repositório: https://github.com/stolpe22/atlas-historico  
  2) Clique em **Code** > **Download ZIP**  
  3) Extraia o arquivo em seu diretório de preferência

## 📦 Instalação e Configuração

### Via Docker (Recomendado)
A forma mais rápida de subir o ambiente completo (Front, Back, DB e Tradutor).

1. Certifique-se de ter o Docker e Docker Compose instalados.
2. Na raiz do projeto, escolha um dos caminhos:
   - **Script de conveniência**
     ```bash
     chmod +x run.sh
     ./run.sh
     ```
   - **Comando direto**
     ```bash
     docker-compose up --build
     ```
3. Acesse as URLs:
   - Frontend: http://localhost:3000
   - Backend (Docs): http://localhost:8000/docs
   - Tradução (LibreTranslate): http://localhost:5000

### Execução Manual (Desenvolvimento)
Caso deseje rodar os serviços fora do Docker para depuração:

1. **Banco de Dados** — Você precisará de um PostgreSQL com PostGIS ativo.
```sql
CREATE DATABASE history_atlas;
CREATE EXTENSION postgis;
```

2. **Backend** — Navegue até a pasta `/backend`:
```bash
# Instale o UV se não tiver
curl -LsSf https://astral.sh/uv/install.sh | sh

# Sincronize dependências e ative venv
uv sync
source .venv/bin/activate

# Rode o servidor
uvicorn app.main:app --reload --port 8000
```

3. **Frontend** — Navegue até a pasta `/frontend`:
```bash
npm install
npm run dev -- --port 3000
```
> Nota: Configure a variável `VITE_API_URL` no seu `.env` se necessário.

## 🧭 Guia do Desenvolvedor: Expandindo o Projeto

### Adicionando Novos Modais de Importação
Para adicionar uma nova fonte de dados no Frontend, edite `projeto/components/modals/ETLModal.jsx` e adicione à constante `ADAPTER_UI_CONFIG`. O formulário será gerado automaticamente.

### Criando um Novo Adaptador ETL
1. Crie um novo arquivo em `app/etl/nome_da_api/adapter.py`.
2. Herde de `BaseEtlAdapter`.
3. Implemente a lógica de `run`.
4. Registre no `app/etl/registry.py`.

```python
# app/etl/exemplo/adapter.py
from ..base import BaseEtlAdapter
from ...services.task_manager import task_manager

class ExemploAdapter(BaseEtlAdapter):
    def run(self, db, task_id, credentials, params):
        task_manager.log(task_id, "Iniciando processo...")
        # Lógica de extração aqui
        return "Sucesso"
```

## 🗺️ Funcionalidades Principais
- Filtro Temporal Dinâmico: Explore desde a Pré-História até a Idade Contemporânea usando o Slider de datas.
- Importação Kaggle: Conecte sua conta do Kaggle e importe datasets massivos de CSV para o banco PostGIS.
- Geofencing Automático: Utiliza multipolígonos de continentes para identificar automaticamente a região geográfica de qualquer coordenada inserida, garantindo consistência nos filtros.
- Restauração Local (Seed): Recupere rapidamente os dados básicos ("seed data") do projeto a partir do `manual_events.json`.
- Geonames Offline: Sincronize milhares de cidades para o seu banco local para garantir geolocalização rápida.
- Tradução EN/PT: Tradução de conteúdos históricos em tempo real via LibreTranslate.

## 📂 Estrutura de Pastas
```
atlas-historico/
├── backend/
│   ├── app/
│   │   ├── etl/            # Adaptadores e lógica de carga (Kaggle, Seed)
│   │   ├── models/         # Modelos SQLAlchemy e PostGIS (Geometry)
│   │   ├── routes/         # Endpoints FastAPI
│   │   └── services/       # TaskManager, EventService
│   ├── docs/               # Markdown de ajuda servido pela API
│   └── Dockerfile          # Build com gerenciador UV
├── frontend/
│   ├── src/
│   │   ├── components/     # Componentes React (Map, Modals, Layout)
│   │   ├── context/        # Gerenciamento de Estado (ETLContext, Toast)
│   │   ├── hooks/          # Hooks customizados (useEvents, useTheme)
│   │   └── pages/          # MainPage, SettingsPage
│   └── Dockerfile          # Build multi-stage Nginx
├── docker-compose.yaml     # Orquestrador de serviços
└── run.sh                  # Script de bootstrap (Build + Up)
```

## 🔐 Variáveis de Ambiente
O backend utiliza o arquivo `.env` (ou variáveis injetadas via Docker Compose):

| Variável         | Descrição                                 | Padrão                  |
|------------------|-------------------------------------------|-------------------------|
| DB_HOST          | Host do banco de dados                    | db (docker) ou localhost |
| DB_NAME          | Nome do banco                             | history_atlas           |
| WIKIDATA_TIMEOUT | Timeout para queries SPARQL               | 120                     |
| QUERY_LIMIT      | Limite de eventos por extração            | 500                     |
| VITE_API_URL     | URL da API para o Frontend                | http://localhost:8000   |

---

Atlas Histórico — Criado por @stolpe22