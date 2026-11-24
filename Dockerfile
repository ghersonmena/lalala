# --- Compilación: genera los archivos estáticos (dist/) ---
FROM node:22-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# Servidor Jellyfin precargado en el login (opcional): docker compose build --build-arg ...
ARG VITE_DEFAULT_SERVER_URL=""
ENV VITE_DEFAULT_SERVER_URL=$VITE_DEFAULT_SERVER_URL
RUN npm run build

# --- Servidor: nginx sirviendo solo archivos estáticos ---
FROM nginx:1.29-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
