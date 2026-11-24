export type ChangeType = 'nuevo' | 'mejora' | 'arreglo'

export interface ChangelogEntry {
  version: string
  /** Fecha ISO (YYYY-MM-DD) */
  date: string
  items: { type: ChangeType; text: string }[]
}

/**
 * Historial de versiones, de la más nueva a la más vieja.
 * Al publicar cambios visibles: agrega una entrada arriba y sube "version" en package.json.
 */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.6.0',
    date: '2026-11-24',
    items: [
      { type: 'nuevo', text: 'Buscar: encuentra artistas, álbumes, canciones y playlists mientras escribes.' },
      { type: 'nuevo', text: 'Tus búsquedas recientes quedan guardadas para repetirlas con un toque.' },
      { type: 'nuevo', text: 'Calidad de streaming en Ajustes: elige una para Wi-Fi y otra para datos móviles.' },
      { type: 'arreglo', text: 'El botón ⋯ de las canciones ahora queda centrado en la fila.' },
    ],
  },
  {
    version: '0.5.0',
    date: '2026-11-24',
    items: [
      { type: 'nuevo', text: 'Hecho para ti: "Mix de la semana" a partir de lo que más escuchas y tus "Favoritas".' },
      { type: 'nuevo', text: 'Marca canciones como favoritas con el ♥ del reproductor o desde el menú ⋯; se sincroniza con Jellyfin.' },
      { type: 'nuevo', text: 'Letras sincronizadas en el reproductor: sigue la canción y toca una línea para saltar a ella.' },
      { type: 'nuevo', text: 'Cola editable: arrastra para reordenar, quita canciones o agrégalas con "Reproducir a continuación".' },
      { type: 'mejora', text: 'Jellyfin ahora registra lo que escuchas, así "Escuchado recientemente" se mantiene al día.' },
    ],
  },
  {
    version: '0.4.1',
    date: '2026-11-24',
    items: [
      { type: 'mejora', text: 'Animaciones al navegar: las pantallas entran deslizándose y regresan al revés; las pestañas cambian con un fundido suave.' },
      { type: 'nuevo', text: 'Desliza a la izquierda o a la derecha para cambiar entre Inicio, Biblioteca y Buscar.' },
    ],
  },
  {
    version: '0.4.0',
    date: '2026-11-20',
    items: [
      { type: 'nuevo', text: '¡Ya suena! Reproduce álbumes, playlists o cualquier canción con un toque.' },
      { type: 'nuevo', text: 'Mini-reproductor siempre a mano y reproductor completo con los colores de la portada.' },
      { type: 'nuevo', text: 'Controles en la notificación, la pantalla de bloqueo y tus audífonos Bluetooth.' },
      { type: 'nuevo', text: 'Cola con aleatorio y repetir; al volver a abrir la app sigue donde te quedaste.' },
      { type: 'nuevo', text: 'Reproduce el archivo original si tu dispositivo lo soporta, o lo convierte automáticamente.' },
    ],
  },
  {
    version: '0.3.0',
    date: '2026-11-20',
    items: [
      { type: 'nuevo', text: 'Inicio muestra lo que escuchaste y lo agregado recientemente en tu servidor.' },
      { type: 'nuevo', text: 'Biblioteca: explora tus playlists, artistas, álbumes, canciones y géneros.' },
      { type: 'nuevo', text: 'Pantallas de álbum, artista y playlist con portadas, duración y formato.' },
      { type: 'nuevo', text: 'Si tienes varias bibliotecas de música, elige cuál ver o míralas todas juntas.' },
      { type: 'mejora', text: 'La app carga más rápido: cada pantalla se descarga solo cuando la abres.' },
    ],
  },
  {
    version: '0.2.0',
    date: '2026-11-20',
    items: [
      { type: 'nuevo', text: 'Conecta tu servidor Jellyfin: escribe tu dominio o IP y la app lo encuentra y lo valida.' },
      { type: 'nuevo', text: 'Inicia sesión con tu usuario de Jellyfin; la sesión se mantiene al cerrar la app.' },
      { type: 'nuevo', text: 'Ajustes muestra tu cuenta y servidor, y permite cerrar sesión.' },
      { type: 'mejora', text: 'Si tu sesión expira o se revoca, la app te lleva de vuelta al inicio de sesión.' },
    ],
  },
  {
    version: '0.1.0',
    date: '2026-11-20',
    items: [
      { type: 'nuevo', text: 'Primera versión: navegación entre Inicio, Biblioteca y Buscar.' },
      { type: 'nuevo', text: 'Tema claro, oscuro o automático según tu dispositivo.' },
      { type: 'nuevo', text: 'Al cambiar de tema, la luz o la oscuridad baja en un círculo desde la esquina superior.' },
      { type: 'nuevo', text: 'Cuatro colores de acento a elegir en Ajustes.' },
      { type: 'nuevo', text: 'Se puede instalar como app (PWA).' },
    ],
  },
]
