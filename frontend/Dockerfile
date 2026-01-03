# Estágio 1: Build (Compila o React)
FROM node:20-alpine as build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio 2: Serve (Roda com Nginx)
FROM nginx:alpine
# Copia o build do estágio anterior para a pasta do Nginx
COPY --from=build /app/dist /usr/share/nginx/html
# Copia configuração customizada do Nginx (opcional, mas recomendado)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]