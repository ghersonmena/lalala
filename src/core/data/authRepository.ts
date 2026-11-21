import {
  MINIMUM_VERSION,
  ProductNameIssue,
  RecommendedServerInfoScore,
  VersionUnsupportedIssue,
  type RecommendedServerInfo,
} from '@jellyfin/sdk'
import { getAuthenticationApi } from '@jellyfin/sdk/lib/utils/api/authentication-api'
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api/session-api'
import { isAxiosError } from 'axios'
import { createApi, jellyfin } from '../api/jellyfin'
import type { ServerInfo, Session } from '../model/session'
import { AppError } from './errors'

const pageIsHttps = () => typeof location !== 'undefined' && location.protocol === 'https:'

/**
 * Valida la dirección del servidor: prueba variantes (https/http, puertos 8096/8920),
 * confirma que es Jellyfin con /System/Info/Public y devuelve la mejor.
 */
export async function validateServer(input: string): Promise<ServerInfo> {
  const value = input.trim()
  if (!value) throw new AppError('invalid-url', 'Escribe la dirección de tu servidor.')

  if (pageIsHttps() && /^http:\/\//i.test(value)) {
    throw new AppError(
      'mixed-content',
      'Esta app se abrió con HTTPS y el navegador bloquea servidores con HTTP. Usa la dirección HTTPS de tu servidor.',
    )
  }

  let candidates: string[]
  try {
    candidates = jellyfin.discovery.getAddressCandidates(value)
  } catch {
    throw new AppError('invalid-url', 'La dirección no es válida. Ejemplo: https://jellyfin.midominio.com')
  }
  // Desde una página HTTPS las variantes HTTP serían bloqueadas de todos modos.
  if (pageIsHttps()) candidates = candidates.filter((c) => c.startsWith('https://'))
  if (candidates.length === 0) {
    throw new AppError('invalid-url', 'La dirección no es válida. Ejemplo: https://jellyfin.midominio.com')
  }

  const servers = await jellyfin.discovery.getRecommendedServers(candidates)
  return pickServer(servers)
}

/** Elige el mejor candidato o explica por qué ninguno sirve. Exportado para tests. */
export function pickServer(servers: RecommendedServerInfo[]): ServerInfo {
  const usable = servers.filter((s) => s.score >= RecommendedServerInfoScore.OK && s.systemInfo)
  const best = jellyfin.discovery.findBestServer(usable)

  if (!best?.systemInfo) {
    if (servers.some((s) => s.issues.some((i) => i instanceof ProductNameIssue))) {
      throw new AppError('not-jellyfin', 'Esa dirección responde, pero no es un servidor Jellyfin.')
    }
    throw new AppError(
      'unreachable',
      'No se pudo conectar. Revisa la dirección, que el servidor esté encendido y que sea accesible desde este dispositivo.',
    )
  }

  const unsupported = best.issues.find((i): i is VersionUnsupportedIssue => i instanceof VersionUnsupportedIssue)
  if (unsupported) {
    throw new AppError(
      'unsupported-version',
      `Tu servidor tiene Jellyfin ${unsupported.version}; se necesita ${MINIMUM_VERSION} o más reciente.`,
    )
  }

  const info = best.systemInfo
  return {
    url: best.address.replace(/\/+$/, ''),
    id: info.Id ?? '',
    name: info.ServerName || 'Jellyfin',
    version: info.Version ?? '',
  }
}

export async function login(server: ServerInfo, username: string, password: string): Promise<Session> {
  const name = username.trim()
  if (!name) throw new AppError('invalid-credentials', 'Escribe tu usuario.')

  try {
    const api = createApi(server.url)
    const { data } = await getAuthenticationApi(api).authenticateUserByName({
      authenticateUserByName: { Username: name, Pw: password },
    })
    if (!data.AccessToken || !data.User?.Id) {
      throw new AppError('server-error', 'El servidor no devolvió una sesión válida.')
    }
    return {
      server,
      userId: data.User.Id,
      userName: data.User.Name ?? name,
      accessToken: data.AccessToken,
    }
  } catch (error) {
    throw toLoginError(error)
  }
}

/** Exportado para tests. */
export function toLoginError(error: unknown): AppError {
  if (error instanceof AppError) return error
  if (isAxiosError(error)) {
    const status = error.response?.status
    if (status === 401 || status === 403) {
      return new AppError('invalid-credentials', 'Usuario o contraseña incorrectos.')
    }
    if (!error.response) {
      return new AppError('unreachable', 'No se pudo contactar al servidor. Revisa tu conexión.')
    }
    return new AppError('server-error', `El servidor respondió con un error (${status}).`)
  }
  return new AppError('server-error', 'Ocurrió un error inesperado al iniciar sesión.')
}

/** Cierra la sesión en el servidor (revoca el token). Si falla (sin red), se ignora. */
export async function logout(session: Session): Promise<void> {
  try {
    await getSessionApi(createApi(session.server.url, session.accessToken)).reportSessionEnded()
  } catch {
    // El cierre local ocurre igual.
  }
}
