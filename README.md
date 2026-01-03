# 🌍 Atlas Histórico Interativo

Uma plataforma full-stack moderna para visualização e gestão de eventos históricos geolocalizados. O sistema combina dados manuais com **ingestão inteligente via Wikidata e Wikipédia**, oferecendo resumos ricos, filtragem temporal e análise geográfica.

![Preview](./preview.png)

## ✨ Principais Funcionalidades

- **🗺️ Visualização Híbrida:** Alterne fluidamente entre **Mapa Interativo** (com clusterização) e **Lista Tabular** (com ações de gestão).
- **🧠 População Inteligente (ETL):**
  - **Modo Turbo:** Busca agressiva por Guerras, Tratados, Revoluções e marcos históricos no Wikidata.
  - **Conteúdo Rico:** O robô acessa a API da Wikipédia para trazer resumos didáticos em português automaticamente.
  - **Modo Varredura:** Scan geográfico detalhado para encontrar eventos obscuros.
- **✍️ Gestão de Dados:**
  - Cadastro manual de eventos com **seletor de coordenadas no mapa**.
  - Proteção de dados: Eventos importados são protegidos, apenas eventos manuais podem ser excluídos.
- **🎨 UX Moderna:**
  - **Dark Mode** automático e manual.
  - Modais de confirmação e notificações (Toast) estilizados.
  - Filtros dinâmicos por Continente, Ano (Slider) e Texto.

## 🚀 Tecnologias

### Frontend
- **React 18 + Vite** (Performance e modularidade)
- **Leaflet & React-Leaflet** (Mapas e Clusterização)
- **Tailwind CSS** (Estilização moderna e Responsiva)
- **Lucide React** (Ícones vetoriais)

### Backend
- **Python 3.10+ & FastAPI** (Alta performance assíncrona)
- **SQLAlchemy & Pydantic** (ORM e Validação de Dados)
- **BeautifulSoup/Requests** (Web Scraping e Integração APIs Externas)

### Banco de Dados & Infra
- **PostgreSQL + PostGIS** (Armazenamento de dados espaciais)
- **Docker & Docker Compose** (Containerização completa)

---

## 🛠️ Como Rodar (Quickstart)

Pré-requisitos: **Docker** e **Docker Compose** instalados.

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/SEU_USUARIO/atlas-historico.git
   cd atlas-historico
   ```

2. **Suba a aplicação:**
   ```bash
   docker-compose up --build
   ```
   *O processo de build pode levar alguns minutos na primeira vez.*

3. **Acesse:**
   - **Frontend (Aplicação):** http://localhost:3000
   - **Backend (Docs API):** http://localhost:8000/docs

## 💾 Populando o Banco de Dados

Esqueça os comandos de terminal! O projeto agora possui um Painel de Controle integrado na interface.

1. Abra a aplicação em http://localhost:3000.
2. No menu lateral direito (ícone de engrenagem ⚙️), você encontrará as opções de ingestão:

### ⚡ Modo Turbo (Recomendado)
Faz uma varredura nas categorias principais (Guerras, Revoluções, Descobertas) do Wikidata e busca automaticamente os resumos na Wikipédia.
- **Tempo estimado:** 2 a 5 minutos.
- **Resultado:** ~3.000 eventos principais com descrições ricas.

### 🔍 Modo Varredura
Realiza uma busca geográfica recursiva por coordenadas e períodos de tempo. Ideal para encontrar eventos menores que não possuem categorias bem definidas.
- **Tempo estimado:** 10+ minutos (processo lento e profundo).
- **Nota:** O sistema remove duplicatas automaticamente ao final de cada processo.

## 📂 Estrutura do Projeto

```
/
├── backend/            # API FastAPI
│   ├── app/
│   │   ├── main.py           # Endpoints e Lógica de Negócio
│   │   ├── models.py         # Schemas do Banco (com is_manual flag)
│   │   ├── populate_final.py # Scripts de ETL (Wikidata/Wikipedia)
│   │   └── database.py       # Conexão Postgres
│   └── Dockerfile
│
├── frontend/           # SPA React
│   ├── src/
│   │   ├── App.jsx           # Componente Principal e Roteamento
│   │   ├── components/       # Modais, Botões e Controles de Mapa
│   │   └── main.jsx
│   └── Dockerfile
│
├── db_init/            # Scripts SQL
│   └── init.sql        # Dump inicial (estrutura + dados base)
│
└── docker-compose.yaml # Orquestração
```

## 🛡️ Decisões de Arquitetura

- **Separação de Responsabilidades:** O Backend cuida da integridade dos dados e regras de negócio (cálculo automático de Período Histórico), enquanto o Frontend foca puramente na experiência do usuário.
- **Persistência Híbrida:** Utilizamos um arquivo `init.sql` para garantir que o projeto "nasça" pronto, mas permitimos expansão dinâmica via API.
- **Segurança de Dados:** A flag `is_manual` no banco impede que usuários apaguem acidentalmente dados históricos validados (Wikidata), permitindo gestão apenas dos registros criados pelo usuário.

## 🤝 Contribuição

Contribuições são bem-vindas! Se você tiver ideias para novas fontes de dados ou melhorias na visualização temporal:

1. Faça um Fork.
2. Crie uma Branch (`git checkout -b feature/nova-feature`).
3. Commit suas mudanças.
4. Abra um Pull Request.

---

Desenvolvido com 💜 e História.