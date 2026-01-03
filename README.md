# 🌍 Atlas Histórico Interativo

Um mapa interativo full-stack que visualiza eventos históricos ao redor do mundo, com filtragem por data, continente e busca textual.

![Preview](./preview.png)

## 🚀 Tecnologias

- **Frontend:** React, Vite, Leaflet (Mapas), CSS Modules.
- **Backend:** Python, FastAPI, SQLAlchemy.
- **Database:** PostgreSQL com PostGIS (Geolocalização).
- **Infra:** Docker & Docker Compose.

## 🛠️ Como Rodar (Quickstart)

Certifique-se de ter o **Docker** e o **Docker Compose** instalados.

1. Clone o repositório:
   ```bash
   git clone [https://github.com/stolpe22/atlas-historico.git](https://github.com/stolpe22/atlas-historico.git)
   cd atlas-historico
   ```

2. Suba a aplicação:
   ```bash
   docker-compose up --build
   ```

3. Acesse no navegador:
   - **Frontend (Mapa):** http://localhost:3000
   - **Backend (Docs):** http://localhost:8000/docs

---

## 💾 Populando o Banco de Dados

Ao rodar pela primeira vez, o mapa estará vazio. O projeto inclui scripts inteligentes para buscar dados da Wikidata e limpar duplicatas.

Para rodar os scripts, execute os comandos abaixo **em outro terminal** (enquanto o docker roda):

### 1. Popular Dados (Brasil, Mundo e Manual)
Este script insere uma lista manual garantida e busca centenas de eventos na Wikidata.

```bash
# Executa o script dentro do container do backend
docker-compose exec backend python app/populate_final.py
```

### 2. Remover Duplicatas
Como agregamos várias fontes, podem haver eventos repetidos. Este script analisa nomes e datas próximas para limpar o banco.

```bash
docker-compose exec backend python app/deduplicate_smart.py
```

### 3. (Opcional) Apagar evento específico
Se precisar remover um evento teimoso pelo nome exato:

```bash
# Edite o arquivo backend/app/delete_specific.py com o nome desejado antes de rodar, ou entre no container
docker-compose exec backend python app/delete_specific.py
```

---

## 📂 Estrutura do Projeto

```
/
├── backend/            # API FastAPI e Scripts ETL
│   ├── app/
│   │   ├── main.py     # Rotas e Configuração da API
│   │   ├── models.py   # Modelos do Banco (SQLAlchemy)
│   │   └── ...scripts  # Scripts de população e limpeza
│   └── Dockerfile
│
├── frontend/           # Aplicação React
│   ├── src/            # Componentes e Lógica do Mapa
│   └── Dockerfile
│
└── docker-compose.yaml # Orquestração dos containers
```

## 🤝 Contribuição

Sinta-se livre para abrir issues ou pull requests melhorando a visualização ou adicionando novas fontes de dados históricos!
