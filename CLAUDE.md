# Proyecto: LaLaLa — cliente de música para Jellyfin (PWA → APK)

> El nombre y el ícono son configurables: `VITE_APP_NAME`, `VITE_APP_SHORT_NAME` y `VITE_APP_ICON` en `.env` (o `.env.local`). Nunca escribas el nombre de la app a mano en el código; usa `APP_NAME` de `src/core/config.ts`. Los íconos PNG de la PWA se generan del SVG en cada build (`@vite-pwa/assets-generator`). Las claves de `localStorage` usan el prefijo fijo `lalala.` y no dependen del nombre.

App para escuchar la biblioteca de música de mi servidor Jellyfin personal, con una interfaz limpia y fluida inspirada en el estilo de Apple Music (sin copiar su marca, íconos ni assets).

Se construye **primero como web PWA** (React) y después se empaqueta como **APK con Capacitor** reutilizando el mismo código.

Ya existe un prototipo visual con 4 pantallas (Inicio, Álbum, Reproductor, Biblioteca). Las especificaciones de diseño de abajo salen de ese prototipo; síguelas lo más fielmente posible.

---

## Cómo quiero que trabajes

- Trabaja **por fases** (ver "Plan por fases"). No avances a la siguiente fase sin que la actual compile y funcione.
- Al terminar cada fase: corre `npm run build`, `npm run lint` y `npm test`, dime qué hiciste y qué falta, y espera mi visto bueno.
- Antes de decisiones grandes (agregar una dependencia no listada aquí, cambiar la arquitectura, agregar plugins de Capacitor), pregúntame.
- Código y nombres en inglés; textos de UI, comentarios y mensajes de commit pueden ir en español.
- Nada de datos inventados en la app final: todo sale de la API de Jellyfin.
- Si un endpoint o parámetro de esta guía no coincide con mi versión de Jellyfin, revisa la documentación Swagger de mi servidor (`{SERVER_URL}/api-docs/swagger/index.html`) y dime la diferencia.
- Cada cambio visible para el usuario se registra en el changelog (ver "Novedades") y sube la versión en `package.json`.

---

## Stack

| Área | Elección |
|---|---|
| Lenguaje | TypeScript (strict) |
| Build | Vite |
| UI | React 19 |
| Estilos | Tailwind CSS 4 + variables CSS para los tokens del tema |
| Navegación | React Router |
| Datos del servidor | TanStack Query (caché, estados de carga/error, reintentos) |
| Estado de cliente | Zustand (sesión, reproductor, preferencias; con `persist`) |
| API Jellyfin | SDK oficial `@jellyfin/sdk` (TypeScript, usa axios) |
| Reproducción | `<audio>` HTML5 + `hls.js` para streams transcodificados (HLS) + Media Session API |
| Animaciones | `motion` (Framer Motion) |
| Íconos | `lucide-react` |
| Color dinámico de portada | `node-vibrant` |
| Fuentes | `@fontsource-variable/manrope`, `@fontsource-variable/inter` (empaquetadas, funcionan offline) |
| PWA | `vite-plugin-pwa` (Workbox) |
| App Android (fase posterior) | Capacitor |
| Offline (fase posterior) | IndexedDB (Dexie, por confirmar) + Cache Storage; en APK, sistema de archivos de Capacitor |
| Tests | Vitest + Testing Library + jsdom |
| Lint | ESLint + typescript-eslint + eslint-plugin-react-hooks |
| Íconos PWA | `@vite-pwa/assets-generator` (genera PNG desde el SVG de `VITE_APP_ICON`) |

- Node 22+. Versiones fijadas en `package.json`.
- Un solo proyecto, organizado por carpetas de feature (ver estructura).

---

## Estructura de carpetas

```
src/
├── app/                 // main.tsx, App, router, providers (Query, Theme)
├── core/
│   ├── theme/           // tokens, ThemeProvider, transición día/noche
│   ├── ui/              // componentes reutilizables (Button, Cover, Carousel, Sheet…)
│   ├── api/             // cliente Jellyfin (SDK), config, manejo de 401
│   ├── data/            // repositorios: auth, library, playback, favorites (mapeo DTO → modelo)
│   ├── model/           // modelos de dominio (Album, Artist, Track, Playlist)
│   └── storage/         // persistencia (sesión, preferencias, último changelog visto)
├── playback/            // motor de audio, cola, Media Session, reporte a Jellyfin
├── changelog/           // datos de versiones + modal de Novedades
└── features/
    ├── login/
    ├── home/
    ├── library/
    ├── album/
    ├── artist/
    ├── player/          // mini-player + reproductor completo
    ├── search/
    └── settings/
```

Mapea los `BaseItemDto` del SDK a modelos de dominio propios en `core/data`; los componentes no deben conocer los DTOs del SDK.

---

## Diseño (tokens del prototipo)

Todos los colores son variables CSS (`--color-*`) que se cambian según el tema; Tailwind las consume desde `@theme`.

### Temas

- Modos: **Sistema** (default, sigue `prefers-color-scheme` y reacciona en vivo cuando el dispositivo cambia), **Claro**, **Oscuro**.
- Acento configurable en ajustes (en ambos temas).
- Dinámico: el reproductor (y opcionalmente la pantalla de Álbum) toma colores de la portada con `node-vibrant`, en claro y en oscuro.
- Actualizar `<meta name="theme-color">` según el tema (barra de estado en Android).

### Transición día/noche (círculo que crece)

Al cambiar entre claro y oscuro (manualmente o porque cambió el sistema):
- Un **círculo** con el tema nuevo crece hasta cubrir la pantalla: la luz que se expande al ir a claro, la oscuridad al ir a oscuro. Dentro del círculo ya se ve la app con el tema nuevo (no un color plano).
- Siempre nace en la **esquina superior derecha** y baja hasta cubrir toda la pantalla (radio hasta la esquina inferior izquierda), tanto en cambios manuales como del sistema.
- Se implementa con View Transitions API (`document.startViewTransition` + `clip-path: circle()` sobre `::view-transition-new(root)`), ~750 ms. Código en `src/core/theme/themeTransition.ts`.
- Sin soporte de View Transitions o con `prefers-reduced-motion`: cambio directo sin animación.
- No usar la versión anterior "cielo animado" (sol/luna/estrellas): fue descartada.

### Colores — oscuro

| Token | Valor | Uso |
|---|---|---|
| `background` | `#0E0E10` | Fondo de pantallas |
| `surface` | `#1E1E22` | Botones secundarios, avatar |
| `surfaceElevated` | `#232328` | Mini-player |
| `navBar` | `#141416` | Barra de navegación inferior |
| `divider` | `#222226` | Separadores de listas |
| `navBorder` | `#26262B` | Borde superior de la barra de navegación |
| `textPrimary` | `#F5F5F7` | Texto principal |
| `textSecondary` | `#A1A1A8` | Artista, subtítulos |
| `textTertiary` | `#8A8A92` | Duraciones, metadatos, íconos inactivos |

### Colores — claro (propuesta, ajustar al verlo)

| Token | Valor |
|---|---|
| `background` | `#F5F5F7` |
| `surface` | `#E8E8ED` |
| `surfaceElevated` | `#FFFFFF` |
| `navBar` | `#FAFAFC` |
| `divider` | `#E2E2E7` |
| `navBorder` | `#D8D8DE` |
| `textPrimary` | `#111114` |
| `textSecondary` | `#55555E` |
| `textTertiary` | `#6E6E78` |

### Acento

| Acento | Oscuro | Claro (más profundo, para contraste sobre fondo claro) |
|---|---|---|
| Naranja coral (default) | `#FF6A3D` | `#D4501F` |
| Rosa | `#FF3B6B` | `#D81E4F` |
| Violeta | `#7C6CFF` | `#5B4BE0` |
| Turquesa | `#2EC4B6` | `#178F84` |

Dónde va el acento: texto de enlaces ("Ver todo"), artista en la pantalla de álbum, texto e íconos de los botones Reproducir/Aleatorio, ítem activo de la barra de navegación, ícono de la canción que suena, íconos de la Biblioteca, barra de progreso del mini-player.

### Tipografía

- **Títulos:** Manrope ExtraBold (800).
- **Cuerpo:** Inter (400/500/600/700).
- Tamaños en `rem` (base 16px) para respetar el zoom del sistema; los valores de abajo son en px a escala 1.

| Estilo | Tamaño | Peso |
|---|---|---|
| Título de pantalla (Inicio, Biblioteca) | 34px, letter-spacing -0.5px | Manrope 800 |
| Título de sección | 21px | Manrope 800 |
| Título de álbum/canción en detalle | 23px | Manrope 800 |
| Filas de Biblioteca | 19px | Inter 400 |
| Canción en lista | 16px | Inter 400 |
| Título de tarjeta | 14px | Inter 500 |
| Artista / subtítulo | 13px | Inter 400 |
| Etiquetas (MIX, metadatos) | 11–12px, mayúsculas, letter-spacing 0.6–1.2px | Inter 600–700 |

### Formas y espaciado

- Margen horizontal de pantalla: 20px.
- Separación entre secciones: 28px.
- Portadas en carrusel: 150×150px, radio 10px; separación 14px (scroll horizontal con `scroll-snap`).
- Tarjetas de mix: alto 196px, radio 14px.
- Portada en pantalla de álbum: 250px, radio 12px, sombra grande.
- Mini-player: alto 64px, radio 16px, margen 10px a los lados, flota 8px arriba de la barra de navegación.
- Botones: radio 12px, alto 48px. Áreas táctiles mínimo 48px.
- Barra de navegación: alto ~84px incluyendo `env(safe-area-inset-bottom)`.
- Íconos de línea con trazo redondeado de 2px: `lucide-react`.
- Diseño mobile-first; en escritorio, contenido centrado con ancho máximo (~480–520px) o layout adaptado, a decidir más adelante.

---

## Pantallas

### 1. Login / Servidor
- Dos pasos: **1) servidor** → solo después de validarlo aparece **2) usuario y contraseña** (con tarjeta del servidor y botón "Cambiar").
- El servidor puede venir de `VITE_DEFAULT_SERVER_URL` (lo define el desarrollador en `.env`/`.env.local`): se valida solo al abrir el login y, si responde, salta directo al paso 2. Si falla, se muestra el paso 1 con la URL precargada y el error.
- Si no hay servidor en el `.env`, el usuario escribe la dirección (dominio o IP, con o sin `https://`/puerto). El SDK prueba variantes (https/http, puertos 8096/8920) y elige la mejor (`validateServer` en `core/data/authRepository.ts`).
- El último servidor validado se recuerda aunque se cierre sesión.
- Campo de URL del servidor → validar con `GET /System/Info/Public` (muestra nombre y versión del servidor).
- Usuario + contraseña → `POST /Users/AuthenticateByName`. **Nunca guardar la contraseña**, solo el `accessToken`.
- Guardar URL del servidor, userId, accessToken y deviceId. Si hay sesión válida, saltar directo a Inicio.
- Más adelante (no ahora): Quick Connect, varios servidores/cuentas.

### 2. Inicio
- Encabezado "Inicio" + botón circular de perfil/servidor (a la derecha, abre Ajustes).
- Línea de estado: punto de color de acento + "Conectado a {nombre del servidor}".
- Sección **"Escuchado recientemente"**: carrusel horizontal de álbumes, con enlace "Ver todo".
- Sección **"Hecho para ti"**: cuadrícula de 2 tarjetas grandes con degradado:
  - "Mix de la semana" → Instant Mix basado en lo que más escucho.
  - "Favoritas" → canciones marcadas como favoritas.
- Sección **"Agregado recientemente"**: carrusel horizontal de álbumes, con enlace "Ver todo".
- Al tocar un álbum → pantalla de Álbum.

### 3. Álbum
- Barra superior: atrás (izquierda, color de acento), descargar y más opciones (derecha).
- Portada grande centrada, título, artista (en acento, tocable → artista), línea de metadatos en mayúsculas: `GÉNERO · AÑO · FORMATO`.
- Dos botones lado a lado: **Reproducir** (ícono play) y **Aleatorio** (ícono shuffle), fondo `surface` y contenido en acento.
- Lista numerada de canciones: número | título | duración | botón "⋯". La canción que suena muestra un ícono de ecualizador en acento en lugar del número y su título en acento.
- Pie: "N canciones · X min".

### 4. Reproductor (pantalla completa)
- Se abre desde el mini-player como un sheet a pantalla completa con transición de expansión; se cierra deslizando hacia abajo o con el botón.
- **Fondo:** degradado vertical generado con `node-vibrant` a partir de la portada (color vibrante/oscuro arriba → casi negro abajo en oscuro; tono claro en tema claro). En el prototipo: `#7E3854 → #4E2457 → #18101C`. Asegura contraste suficiente del texto.
- Arriba: indicador para arrastrar, botón cerrar (chevron abajo), texto "REPRODUCIENDO DESDE EL ÁLBUM" + nombre, botón "⋯".
- Portada grande (~336px). **Al pausar se encoge** (~272px) con animación suave; al reanudar vuelve a su tamaño.
- Título + artista a la izquierda, botón de favorito (corazón) a la derecha.
- Barra de progreso arrastrable, tiempo transcurrido / tiempo restante (`-m:ss`).
- Insignia central pequeña con el formato y el modo de reproducción, por ejemplo `FLAC · DIRECT PLAY` o `AAC 256 · TRANSCODIFICANDO` (sale de la respuesta de PlaybackInfo / del stream).
- Controles: anterior, reproducir/pausa (grande), siguiente.
- Control de volumen (en móvil el navegador puede ignorarlo; ocultarlo si no aplica).
- Fila inferior: Letras (se activa con fondo blanco), Transmitir (fase posterior), Cola.

### 5. Mini-player (persistente)
- Visible en todas las pantallas excepto el reproductor completo, cuando hay algo en cola.
- Portada 44px, título y artista, botón reproducir/pausa, botón siguiente.
- Línea delgada de progreso (2px) en acento en el borde inferior.

### 6. Biblioteca
- Encabezado "Biblioteca" + botón "Editar" en acento (pendiente: aún no definido qué edita; no mostrarlo hasta que tenga función).
- **Varias bibliotecas de música:** la app es para cualquier usuario de Jellyfin. Si el usuario tiene acceso a más de una biblioteca `music`, se muestran chips "Todas" + una por biblioteca (`LibraryPicker`). La elección se recuerda (`libraryStore`) y filtra Inicio, Biblioteca y las listas. Con una sola biblioteca no se muestra el selector. Las playlists no dependen de la biblioteca.
- Filas con ícono en acento y chevron: Playlists, Artistas, Álbumes, Canciones, Géneros, Descargado.
- Sección "Agregado recientemente": cuadrícula de 2 columnas de álbumes.

### 7. Buscar (sin prototipo todavía)
- Campo de búsqueda (con debounce) con resultados agrupados: Artistas, Álbumes, Canciones, Playlists.

### 8. Ajustes
- Tema (Sistema / Claro / Oscuro), color de acento, calidad de streaming, "Novedades" (abre el historial completo), info del servidor, cerrar sesión, versión de la app.

### Barra de navegación inferior
Tres pestañas: **Inicio**, **Biblioteca**, **Buscar**. La activa en color de acento, las demás en `textTertiary`.

---

## Novedades (changelog)

- Las versiones viven en `src/changelog/changelog.ts`: lista de `{ version, date, items: { type: 'nuevo' | 'mejora' | 'arreglo', text }[] }`, de la más nueva a la más vieja. La versión actual sale de `package.json`.
- Se guarda `lastSeenVersion` en el almacenamiento local.
- Al abrir la app: si la versión más nueva del changelog es mayor que `lastSeenVersion` (o nunca se vio ninguna, después del primer login), se muestra el modal **solo con las versiones no vistas**. Al cerrarlo se guarda la versión actual como vista y no vuelve a salir hasta que haya una versión nueva.
- Desde Ajustes → "Novedades" se puede abrir en cualquier momento el **historial completo** de versiones.
- Con la PWA: cuando el service worker detecta una versión nueva, se muestra un aviso "Hay una actualización" con botón para recargar; después de recargar se muestra el modal de novedades.

---

## API de Jellyfin (referencia)

Autenticación: header `Authorization: MediaBrowser Client="<APP_NAME>", Device="<navegador/dispositivo>", DeviceId="<uuid persistente>", Version="<versión>", Token="<accessToken>"`. El SDK lo arma; genera y guarda un `DeviceId` estable (por instalación).

| Necesidad | Endpoint |
|---|---|
| Info pública del servidor | `GET /System/Info/Public` |
| Login | `POST /Users/AuthenticateByName` |
| Logout | `POST /Sessions/Logout` |
| Bibliotecas del usuario (filtrar `CollectionType == music`) | `GET /UserViews` |
| Álbumes recientes | `GET /Items?ParentId={musicLib}&IncludeItemTypes=MusicAlbum&Recursive=true&SortBy=DateCreated&SortOrder=Descending&Limit=20` |
| Escuchado recientemente | `GET /Items?IncludeItemTypes=Audio&Recursive=true&SortBy=DatePlayed&SortOrder=Descending&Filters=IsPlayed&Limit=30` (agrupar por álbum) |
| Artistas | `GET /Artists/AlbumArtists` |
| Canciones de un álbum | `GET /Items?ParentId={albumId}&SortBy=ParentIndexNumber,IndexNumber` |
| Favoritas | `GET /Items?Filters=IsFavorite&IncludeItemTypes=Audio&Recursive=true` |
| Marcar/desmarcar favorito | `POST` / `DELETE /UserFavoriteItems/{itemId}` |
| Mix | `GET /Items/{itemId}/InstantMix` |
| Playlists | `GET /Items?IncludeItemTypes=Playlist&Recursive=true`, `/Playlists/...` |
| Búsqueda | `GET /Items?SearchTerm=...&IncludeItemTypes=MusicArtist,MusicAlbum,Audio,Playlist&Recursive=true` |
| Portadas | `GET /Items/{id}/Images/Primary?fillWidth={px}&quality=90` |
| Letras | `GET /Audio/{itemId}/Lyrics` |
| Info de reproducción | `POST /Items/{itemId}/PlaybackInfo` |
| Stream de audio | `GET /Audio/{itemId}/universal?UserId=..&DeviceId=..&MaxStreamingBitrate=..&Container=flac,mp3,aac,m4a,opus,ogg,wav&TranscodingContainer=ts&TranscodingProtocol=hls&AudioCodec=aac&api_key=..` |
| Reportar reproducción | `POST /Sessions/Playing`, `/Sessions/Playing/Progress`, `/Sessions/Playing/Stopped` |

Notas:
- Pide solo los `Fields` necesarios en `/Items` para que sea rápido (por ejemplo `PrimaryImageAspectRatio,Genres,ProductionYear,MediaSources`).
- Pagina con `StartIndex` + `Limit` en listas grandes (Canciones, Álbumes); usa scroll infinito/virtualizado.
- `<audio>` no puede enviar headers: para el stream directo el token va como `api_key` en la URL. Con `hls.js` se puede usar `xhrSetup` para mandar el header. Las imágenes normalmente no requieren auth.
- Pide `srcset`/`fillWidth` según la densidad de pantalla (150px × devicePixelRatio).
- Los tiempos de Jellyfin vienen en *ticks* (1 tick = 100 ns): `ms = ticks / 10_000`.
- Elige el formato con `canPlayType()` del navegador: si lo soporta, direct play; si no, HLS transcodificado (Safari reproduce HLS nativo, el resto usa `hls.js`).

---

## Reproducción (web)

- Un solo motor de audio (`playback/`) fuera del árbol de React, expuesto con un store de Zustand (estado: cola, índice, posición, duración, pausado, buffering, formato/modo).
- **Media Session API**: título, artista, portada y acciones (play, pause, anterior, siguiente, seek) para la notificación, la pantalla de bloqueo y Bluetooth.
- Cola: reproducir álbum, reproducir desde la canción X, aleatorio, siguiente/anterior, repetir (uno/todos).
- Casi-gapless: precargar la siguiente pista en un segundo `<audio>` y cambiar al terminar. El gapless perfecto no está garantizado en web.
- Guardar la última cola y la posición para restaurarlas al abrir la app (sin autoplay).
- Reportar inicio, progreso (cada ~10 s y en pausa/seek) y fin de reproducción a Jellyfin.
- Limitación conocida: en iOS/Safari y en algunos navegadores Android el audio en segundo plano de una PWA es frágil. En la APK se resolverá con un plugin nativo de Capacitor (foreground service + MediaSession), a decidir en esa fase.

---

## Despliegue, red y seguridad

- Hosting: la PWA se sirve como archivos estáticos (`dist/`) desde mi servidor personal, en un **subdominio propio publicado con Cloudflare** (el mismo esquema que mis otras apps), en HTTPS. Jellyfin también está en su subdominio HTTPS.
- La URL del servidor Jellyfin es configurable en el login (no está fija en el código); puede tener un valor por defecto vía `VITE_DEFAULT_SERVER_URL`.
- CORS: la PWA y Jellyfin están en subdominios distintos, así que el navegador hace peticiones cross-origin. Jellyfin permite cualquier origen por defecto; si falla, revisar el reverse proxy/Cloudflare y no "arreglarlo" con proxys raros en el cliente.
- Si el subdominio de Jellyfin está detrás de Cloudflare Access (Zero Trust), las llamadas de la API fallarán desde la app: avisarme si lo detectas.
- Recomendado: regla de Cloudflare para **no cachear** `/Audio/*` ni `/Items/*/PlaybackInfo` (los streams y respuestas dinámicas no deben pasar por la caché).
- Contenido mixto: una página HTTPS no puede llamar a un Jellyfin en HTTP. En desarrollo (`vite dev` en `http://localhost`) sí se puede usar la IP local por HTTP.
- Token: en web se guarda en `localStorage` (no hay almacenamiento realmente seguro en el navegador; mitigamos con buena CSP y sin `dangerouslySetInnerHTML`). En la APK, migrar a almacenamiento seguro nativo.
- Manejo de errores con estados de UI claros: 401 (token expirado/revocado → volver al login), sin red (banner "Sin conexión"), servidor inaccesible.

---

## Plan por fases

**Fase 0 — Proyecto base**
- Vite + React + TS, Tailwind, React Router, TanStack Query, Zustand, ESLint, Vitest, PWA (manifest + service worker básico), estructura de carpetas.
- Tema con tokens claro/oscuro, modo Sistema/Claro/Oscuro, acento, fuentes y la transición circular día/noche.
- Router con las 3 pestañas (pantallas vacías) + barra de navegación inferior.
- Infraestructura de Novedades (changelog + modal + "visto").
- ✅ Compila, se instala como PWA, navega entre pestañas, cambia de tema con la animación y muestra Novedades una sola vez.

**Fase 1 — Conexión y login**
- Pantalla de servidor + login, persistencia de sesión, logout, manejo de 401.
- ✅ Me conecto a mi servidor real y la sesión sobrevive a recargar la app.

**Fase 2 — Navegar la biblioteca**
- Inicio (recientes, agregados), Biblioteca (filas + cuadrícula), Álbum (detalle + canciones), Artista básico.
- Portadas con placeholders/skeletons, estados de carga, vacío y error.
- ✅ Veo mi música real con el diseño del prototipo.

**Fase 3 — Reproducción**
- Motor de audio + cola, Media Session, mini-player, reproductor completo con fondo dinámico, portada que se encoge al pausar, progreso arrastrable e insignia de formato.
- ✅ Reproduzco un álbum y lo controlo desde la notificación/pantalla de bloqueo del teléfono.

**Fase 4 — Integración con Jellyfin**
- Reportar reproducción, favoritos, "Hecho para ti" (Instant Mix + Favoritas), letras sincronizadas, cola editable.
- ✅ Jellyfin registra lo que escucho y los favoritos se sincronizan.

**Fase 5 — Búsqueda y ajustes**
- Pantalla Buscar; Ajustes completos (tema, acento, calidad de streaming, Novedades, cerrar sesión).

**Fase 6 — APK con Capacitor**
- Proyecto Android con Capacitor, ícono/splash, audio en segundo plano nativo, almacenamiento seguro del token, `network_security_config` si hace falta HTTP en la LAN.

**Fase 7 — Offline y extras**
- Descargas offline (IndexedDB/Cache Storage en web; archivos nativos en APK), sección "Descargado", modo sin conexión.
- Quick Connect, varios servidores/cuentas, Transmitir, widget.

---

## Para empezar

Arranca con la **Fase 0**. Antes de escribir código, muéstrame:
1. El `package.json` propuesto con las versiones.
2. El árbol de carpetas que vas a crear.

Luego impleméntala.
