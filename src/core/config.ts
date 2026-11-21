// Configuración de la app que viene del build (.env) y de package.json.
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'LaLaLa'
export const APP_VERSION = __APP_VERSION__
export const DEFAULT_SERVER_URL = import.meta.env.VITE_DEFAULT_SERVER_URL || ''
