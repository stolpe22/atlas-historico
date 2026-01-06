# 🌍 Atlas Histórico

O **Atlas Histórico** é uma plataforma geográfica interativa de código aberto projetada para consolidar, visualizar e gerenciar cronologias históricas mundiais. Combinando o poder de bancos de dados geoespaciais com uma interface dinâmica, o projeto permite que usuários e historiadores explorem batalhas, tratados, descobertas e eventos através do tempo e do espaço.

## 📖 Índice

- [Visão Geral e Propósito](#-visão-geral-e-propósito)
- [Arquitetura de Software](#-arquitetura-de-software)
  - [Frontend: Data-Driven Design](#frontend-data-driven-design)
  - [Backend: Motor de ETL Unificado](#backend-motor-de-etl-unificado)
- [Stack Tecnológica](#-stack-tecnológica)
- [Instalação e Configuração](#-instalação-e-configuração)
  - [Via Docker (Recomendado)](#via-docker-recomendado)
  - [Execução Manual (Desenvolvimento)](#execução-manual-desenvolvimento)
- [Guia do Desenvolvedor: Expandindo o Projeto](#-guia-do-desenvolvedor-expandindo-o-projeto)
  - [Adicionando Novos Modais de Importação](#adicionando-novos-modais-de-importação)
  - [Criando um Novo Adaptador ETL](#criando-um-novo-adaptador-etl)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)

## 🎯 Visão Geral e Propósito

Muitos dados históricos estão dispersos em arquivos CSV, bancos de dados legados ou APIs complexas como a do Wikidata. O Atlas Histórico atua como um **Agregador Geográfico**, oferecendo uma interface unificada onde esses dados são normalizados e projetados em um mapa global, permitindo filtros por período e continente.

## 🏗️ Arquitetura de Software

### Frontend: Data-Driven Design

A interface não é apenas um conjunto de páginas, mas um sistema que reage a metadados. O coração dessa abordagem está no `ETLModal.jsx`.

Diferenciais:
- **Configuração via Constantes:** Os formulários de importação são gerados dinamicamente. Se você precisar de um novo campo de texto ou senha para uma nova API, você não altera o JSX, apenas a constante `ADAPTER_UI_CONFIG`.
- **Gerenciamento de Estado Persistente:** Através do `ETLContext`, o frontend mantém o rastreamento de tarefas de background. O uso do `localStorage` garante que, se a página for fechada durante uma importação de 50.000 registros do Kaggle, o progresso reapareça instantaneamente ao abrir o site novamente.
- **Visualização de Alta Performance:** Implementação de Markers Clustering com carregamento fragmentado, garantindo 60fps mesmo com milhares de pontos na tela.

### Backend: Motor de ETL Unificado

O backend utiliza o **Registry Pattern** para gerenciar integrações. Em vez de criar dezenas de endpoints como `/import-kaggle` ou `/import-json`, existe apenas um endpoint mestre: `/etl/run`.

Fluxo de uma Tarefa ETL:
1. O cliente envia um slug (ex: `kaggle`) e `params`.
2. O Registry localiza a classe correspondente que herda de `BaseEtlAdapter`.
3. O `TaskManager` inicia a tarefa em uma thread de background (`FastAPI BackgroundTasks`).
4. O `TaskManager` gerencia logs em memória e estados de interrupção (Graceful Shutdown).

## 🛠️ Stack Tecnológica

### Frontend
- Framework: React 18 (Vite)
- Estilização: Tailwind CSS (com suporte a Dark Mode nativo)
- Mapas: Leaflet.js & React-Leaflet
- Componentes de UI: Lucide React (Ícones), `rc-slider` (Linha do tempo)

### Backend
- Framework: FastAPI (Python 3.10+)
- Gerenciador de Pacotes: UV (Substituto moderno e 10x mais rápido que o Pip)
- ORM: SQLAlchemy 2.0
- Banco de Dados: PostgreSQL 16 com extensão PostGIS

## 📦 Instalação e Configuração

### Via Docker (Recomendado)

A forma mais rápida de subir o ambiente completo (Front, Back, DB e Tradutor).

1. Certifique-se de ter o Docker e Docker Compose instalados.
2. Use o script de conveniência:
   ```bash
   chmod +x run.sh
   ./run.sh
   ```
3. Acesse as URLs:
   - Frontend: http://localhost:3000
   - Backend (Docs): http://localhost:8000/docs
   - Tradução: http://localhost:5000

### Execução Manual (Desenvolvimento)

Caso deseje rodar os serviços fora do Docker para depuração:

1. Banco de Dados

   Você precisará de um PostgreSQL com PostGIS ativo.
   ```sql
   CREATE DATABASE history_atlas;
   CREATE EXTENSION postgis;
   ```

2. Backend

   Navegue até a pasta `/backend`:
   ```bash
   # Instale o UV se não tiver
   curl -LsSf https://astral.sh/uv/install.sh | sh

   # Sincronize dependências e ative venv
   uv sync
   source .venv/bin/activate

   # Rode as migrações/tabelas (o app cria ao iniciar)
   uvicorn app.main:app --reload --port 8000
   ```

3. Frontend

   Navegue até a pasta `/frontend`:
   ```bash
   npm install
   npm run dev -- --port 3000
   ```
   > Nota: Certifique-se de configurar a variável `VITE_API_URL` no seu ambiente.

## 🧭 Guia do Desenvolvedor: Expandindo o Projeto

### Adicionando Novos Modais de Importação

Para adicionar uma nova fonte de dados no Frontend, edite `projeto/components/modals/ETLModal.jsx` e adicione à constante `ADAPTER_UI_CONFIG`.

Exemplo de adição de um campo de input:
```javascript
const ADAPTER_UI_CONFIG = {
  // ... existentes
  minha_api_nova: {
    title: "Minha API",
    headerTitle: "Configurar Acesso",
    ctaLabel: "Sincronizar Agora",
    icon: "https://site.com/logo.svg",
    description: "Importa eventos de uma API privada.",
    defaultParams: { api_token: "", categoria: "Guerras" },
    inputs: [
      { 
        key: "api_token", 
        label: "Chave de Acesso", 
        type: "password", 
        placeholder: "Insira seu token..." 
      },
      { 
        key: "categoria", 
        label: "Categoria de Eventos", 
        type: "text", 
        placeholder: "Ex: Científicos" 
      }
    ]
  }
};
```

### Criando um Novo Adaptador ETL

1. Crie um novo arquivo em `app/etl/nome_da_api/adapter.py`.
2. Herde de `BaseEtlAdapter`.
3. Registre no `app/etl/registry.py`.

Exemplo:
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
- Restauração Local (Seed): Recupere rapidamente os dados básicos do projeto a partir do `manual_events.json`.
- Geonames Offline: Sincronize milhares de cidades para o seu banco local para garantir geolocalização rápida.
- Tradução EN/PT: Tradução de conteúdos históricos em tempo real via LibreTranslate.

## 📂 Estrutura de Pastas

```plaintext
atlas-historico/
├── backend/
│   ├── app/
│   │   ├── etl/            # Adaptadores e lógica de carga
│   │   │   ├── kaggle/     # Lógica do Kaggle (Extractor/Processor)
│   │   │   └── seed/       # Lógica de restauração local
│   │   ├── models/         # Modelos SQLAlchemy (Eventos, Geonames)
│   │   ├── routes/         # Endpoints FastAPI
│   │   └── services/       # TaskManager, EventService
│   └── Dockerfile          # Build com gerenciador UV
├── frontend/
│   ├── src/
│   │   ├── components/     # Componentes React (Map, Modals, Layout)
│   │   ├── context/        # ETLContext, ToastContext
│   │   ├── hooks/          # useEvents, useTheme
│   │   └── pages/          # MainPage, SettingsPage
│   └── Dockerfile          # Build multi-stage Nginx
├── docker-compose.yaml     # Orquestrador de serviços
└── run.sh                  # Script de bootstrap (Build + Up)
```

## 🔐 Variáveis de Ambiente

O backend utiliza o arquivo `.env` (ou variáveis injetadas via Docker Compose):

| Variável           | Descrição                         | Padrão                     |
|--------------------|-----------------------------------|----------------------------|
| `DB_HOST`          | Host do banco de dados            | `db` (docker) ou `localhost` |
| `DB_NAME`          | Nome do banco                     | `history_atlas`            |
| `WIKIDATA_TIMEOUT` | Timeout para queries SPARQL       | `120`                      |
| `QUERY_LIMIT`      | Limite de eventos por extração    | `500`                      |

---

Atlas Histórico - @stolpe22
