import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api'
import { useQuery } from '@tanstack/react-query'
import { useApi } from '../api/sessionApi'
import { useSessionStore } from './sessionStore'

/**
 * Al abrir la app confirma que el token guardado sigue siendo válido (GET /Users/Me).
 * Si el servidor responde 401, el interceptor de la Api cierra la sesión y se vuelve al login.
 * Sin red se conserva la sesión (no se fuerza el login estando offline).
 */
export function useSessionCheck() {
  const api = useApi()
  const userId = useSessionStore((s) => s.session?.userId)
  return useQuery({
    queryKey: ['session-check', userId],
    queryFn: async () => (await getUserApi(api).getCurrentUser()).data,
    staleTime: Infinity,
    retry: false,
  })
}
