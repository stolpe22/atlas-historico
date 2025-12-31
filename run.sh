#!/bin/bash

# Cores para ficar bonito no terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando o Atlas Histórico e construindo containers...${NC}"

# Sobe os containers em background (-d) e força o build (--build)
docker-compose up -d --build

# Verifica se deu erro no comando anterior
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Falha ao iniciar o Docker Compose.${NC}"
    exit 1
fi

echo -e "${BLUE}⏳ Aguardando os serviços ficarem prontos (5s)...${NC}"
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
echo -e "${GREEN}==================================================${NC}"
echo -e "📝 Para acompanhar os logs:  ${BLUE}docker-compose logs -f${NC}"
echo -e "🛑 Para parar a aplicação:   ${BLUE}docker-compose down${NC}"
echo -e "${GREEN}==================================================${NC}"