#!/usr/bin/env bash
set -euo pipefail

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

COMPOSE_CMD="docker compose"
if ! command -v docker &>/dev/null; then
  echo -e "${RED}❌ Docker não encontrado. Instale Docker Desktop/Engine.${NC}"
  exit 1
fi

echo -e "${BLUE}🚀 Iniciando o Atlas Histórico e construindo containers...${NC}"
$COMPOSE_CMD up -d --build || { echo -e "${RED}❌ Falha ao iniciar o Docker Compose.${NC}"; exit 1; }

echo -e "${BLUE}⏳ Aguardando os serviços ficarem prontos...${NC}"
sleep 5

echo ""
echo -e "${GREEN}==================================================${NC}"
echo -e "${GREEN}   ✅  PROJETO RODANDO COM SUCESSO!${NC}"
echo -e "${GREEN}==================================================${NC}"
echo ""
echo -e "${CYAN}🌍 FRONTEND (Mapa Interativo):${NC}"
echo -e "   👉 http://localhost:3000"
echo ""
echo -e "${CYAN}🔌 BACKEND (Documentação API):${NC}"
echo -e "   👉 http://localhost:8000/docs"
echo ""
echo -e "${CYAN}🈳 LibreTranslate (tradutor EN/PT):${NC}"
echo -e "   👉 http://localhost:5000"
echo ""
echo -e "${GREEN}==================================================${NC}"
echo -e "📝 Logs em tempo real:  ${BLUE}$COMPOSE_CMD logs -f${NC}"
echo -e "🛑 Parar a aplicação:   ${BLUE}$COMPOSE_CMD down${NC}"
echo -e "${GREEN}==================================================${NC}"