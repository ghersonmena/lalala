import type { Api } from '@jellyfin/sdk'
import axios from 'axios'
import { useMemo } from 'react'
import type { Session } from '../model/session'
import { useSessionStore } from '../session/sessionStore'
import { jellyfin } from './jellyfin'

/**
 * Api autenticada para una sesión. Usa su propia instancia de axios con un interceptor:
 * si el servidor responde 401 (token expirado o revocado) se cierra la sesión local
 * y el router manda al login.
 */
export function createSessionApi(session: Session): Api {
  const instance = axios.create()
  instance.interceptors.response.use(undefined, (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      useSessionStore.getState().expire()
    }
    return Promise.reject(error)
  })
  return jellyfin.createApi(session.server.url, session.accessToken, instance)
}

/** Api de la sesión actual. Solo usar dentro de rutas protegidas (hay sesión garantizada). */
export function useApi(): Api {
  const session = useSessionStore((s) => s.session)
  const api = useMemo(() => (session ? createSessionApi(session) : null), [session])
  if (!api) throw new Error('useApi() requiere una sesión iniciada')
  return api
}
