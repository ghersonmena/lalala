import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useSessionStore } from '../core/session/sessionStore'

/** Protege las rutas de la app: sin sesión (o si expiró por un 401) manda al login. */
export function RequireSession({ children }: { children: ReactNode }) {
  const session = useSessionStore((s) => s.session)
  if (!session) return <Navigate to="/login" replace />
  return children
}
