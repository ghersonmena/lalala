// Configuración de la app que viene del build (.env) y de package.json.
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'LaLaLa'
export const APP_VERSION = __APP_VERSION__
/** Servidor Jellyfin precargado por el desarrollador (opcional). Si existe, se valida solo al abrir el login. */
export const DEFAULT_SERVER_URL = (import.meta.env.VITE_DEFAULT_SERVER_URL || '').trim()
/** URL pública del ícono (VITE_APP_ICON apunta a un archivo dentro de public/). */
export const APP_ICON_URL = '/' + (import.meta.env.VITE_APP_ICON || 'public/icon.svg').replace(/^\/?(public\/)?/, '')
