import { Jellyfin, type Api } from '@jellyfin/sdk'
import { APP_NAME, APP_VERSION } from '../config'
import { readString, storageKeys, writeString } from '../storage/storage'

/** Id estable por instalación (lo pide Jellyfin para identificar el dispositivo y sus sesiones). */
function getDeviceId(): string {
  let id = readString(storageKeys.deviceId)
  if (!id) {
    id = randomId()
    writeString(storageKeys.deviceId, id)
  }
  return id
}

// crypto.randomUUID solo existe en contextos seguros (HTTPS/localhost); en la LAN por HTTP no.
function randomId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Nombre legible del dispositivo para el panel de Jellyfin (p. ej. "Chrome en Android"). */
function getDeviceName(): string {
  const ua = navigator.userAgent
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /Firefox\//.test(ua)
      ? 'Firefox'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Safari\//.test(ua)
          ? 'Safari'
          : 'Navegador'
  const os = /Android/.test(ua)
    ? 'Android'
    : /iPhone|iPad/.test(ua)
      ? 'iOS'
      : /Windows/.test(ua)
        ? 'Windows'
        : /Mac OS/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : ''
  return os ? `${browser} en ${os}` : browser
}

export const jellyfin = new Jellyfin({
  clientInfo: { name: APP_NAME, version: APP_VERSION },
  deviceInfo: { name: getDeviceName(), id: getDeviceId() },
})

export function createApi(serverUrl: string, accessToken?: string): Api {
  return jellyfin.createApi(serverUrl, accessToken)
}
