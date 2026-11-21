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
