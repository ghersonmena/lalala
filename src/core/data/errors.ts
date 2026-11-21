import { isAxiosError } from 'axios'

export type AppErrorCode =
  | 'invalid-url'
  | 'mixed-content'
  | 'unreachable'
  | 'not-jellyfin'
  | 'unsupported-version'
  | 'invalid-credentials'
  | 'unauthorized'
  | 'not-found'
  | 'server-error'

/** Error de la app con un mensaje listo para mostrar al usuario. */
export class AppError extends Error {
  readonly code: AppErrorCode

  constructor(code: AppErrorCode, message: string) {
    super(message)
    this.name = 'AppError'
    this.code = code
  }
}

/** Errores que no tiene sentido reintentar (sesión inválida o elemento inexistente). */
export function isPermanentError(error: unknown): boolean {
  if (error instanceof AppError) return error.code === 'unauthorized' || error.code === 'not-found'
  const status = isAxiosError(error) ? error.response?.status : undefined
  return status === 401 || status === 403 || status === 404
}

export function isUnauthorized(error: unknown): boolean {
  return (
    (error instanceof AppError && error.code === 'unauthorized') ||
    (isAxiosError(error) && error.response?.status === 401)
  )
}

/** Traduce errores de red/HTTP de una petición autenticada a un AppError. */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error
  if (isAxiosError(error)) {
    const status = error.response?.status
    if (status === 401) return new AppError('unauthorized', 'Tu sesión expiró. Vuelve a iniciar sesión.')
    if (status === 404) return new AppError('not-found', 'No se encontró en tu servidor. Puede que se haya eliminado.')
    if (!error.response) {
      return new AppError('unreachable', 'No se pudo contactar al servidor. Revisa tu conexión.')
    }
    return new AppError('server-error', `El servidor respondió con un error (${status}).`)
  }
  return new AppError('server-error', 'Ocurrió un error inesperado.')
}
