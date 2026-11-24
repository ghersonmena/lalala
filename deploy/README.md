# Desplegar LaLaLa (PWA) en tu servidor

La app es solo archivos estáticos: un contenedor con nginx los sirve y Cloudflare la publica
en un subdominio con HTTPS. Las llamadas a la música van directo de tu teléfono a tu Jellyfin.

## 1. Primera vez

```bash
git clone git@github.com:ghersonmena/lalala.git
cd lalala

# Opcional: precargar tu Jellyfin en el login
VITE_DEFAULT_SERVER_URL=https://jellyfin.tudominio.com docker compose up -d --build
# o sin precarga:
docker compose up -d --build
```

Queda escuchando en `http://127.0.0.1:8086` (solo dentro del servidor). Cambia el puerto en
`docker-compose.yml` si ya está ocupado.

## 2. Publicarla con Cloudflare

**Con Cloudflare Tunnel** (Zero Trust → Networks → Tunnels → tu túnel → *Public hostname* → *Add*):

- Subdomain: `musica` (o el que quieras) · Domain: `tudominio.com`
- Service: `HTTP` → `localhost:8086`
- Si `cloudflared` corre en Docker, `localhost` no es el servidor: pon ambos contenedores en la
  misma red y usa `http://lalala:80` (y quita el mapeo `127.0.0.1:8086` si no lo necesitas).

**Con DNS proxied + tu reverse proxy** (nginx, Caddy, Nginx Proxy Manager…): crea el registro
`musica` en Cloudflare (nube naranja) y en tu proxy apunta ese host a `http://127.0.0.1:8086`.

## 3. Revisar en Cloudflare (una vez)

- **El subdominio de Jellyfin no debe tener Cloudflare Access** (Zero Trust): bloquearía las
  llamadas de la app.
- **Regla de caché para Jellyfin**: *Caching → Cache Rules* → si el hostname es el de Jellyfin y
  la ruta empieza con `/Audio/` → *Bypass cache*. Los streams no deben pasar por la caché.
- El subdominio de la app sí puede cachearse: nginx ya marca qué se guarda y qué no.

## 4. En el teléfono

1. Abre `https://musica.tudominio.com` en Chrome.
2. Inicia sesión con la dirección **HTTPS** de tu Jellyfin.
3. Menú ⋮ → **Instalar app** (o "Agregar a la pantalla principal").
4. Borra cualquier copia instalada desde un enlace `trycloudflare.com`: es una versión vieja.

En Ajustes → Versión ves qué versión tienes.

## 5. Actualizar

```bash
cd lalala
git pull
docker compose up -d --build   # (con la misma VITE_DEFAULT_SERVER_URL si la usas)
```

La próxima vez que abras la app aparece **"Hay una actualización disponible"** → Actualizar,
y luego el modal de Novedades. Si no aparece, cierra y vuelve a abrir la app.
