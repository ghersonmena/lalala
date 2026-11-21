/** Servidor Jellyfin ya validado con /System/Info/Public. */
export interface ServerInfo {
  /** URL base normalizada, sin "/" final (p. ej. https://jellyfin.midominio.com) */
  url: string
  id: string
  name: string
  version: string
}

/** Sesión iniciada en un servidor. Nunca contiene la contraseña. */
export interface Session {
  server: ServerInfo
  userId: string
  userName: string
  accessToken: string
}
