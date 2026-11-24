// Prefijo fijo e interno para las claves de almacenamiento: no depende de VITE_APP_NAME,
// así cambiar el nombre visible de la app no borra preferencias ni sesión.
const PREFIX = 'lalala.'

export const storageKeys = {
  prefs: `${PREFIX}prefs`,
  changelogSeen: `${PREFIX}changelog.lastSeenVersion`,
  deviceId: `${PREFIX}deviceId`,
  session: `${PREFIX}session`,
  library: `${PREFIX}library`,
  playback: `${PREFIX}playback`,
  searchHistory: `${PREFIX}search.recent`,
  playbackPrefs: `${PREFIX}playback.prefs`,
} as const

export function readString(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeString(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Almacenamiento no disponible (modo privado, cuota llena): se ignora.
  }
}
