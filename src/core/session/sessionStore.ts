import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ServerInfo, Session } from '../model/session'
import { storageKeys } from '../storage/storage'

interface SessionState {
  /** Último servidor validado; se conserva al cerrar sesión para volver directo al login. */
  server: ServerInfo | null
  session: Session | null
  /** true si la sesión se cerró porque el servidor rechazó el token (401). No se persiste. */
  expired: boolean
  setServer: (server: ServerInfo) => void
  forgetServer: () => void
  signIn: (session: Session) => void
  signOut: () => void
  expire: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      server: null,
      session: null,
      expired: false,
      setServer: (server) => set({ server }),
      forgetServer: () => set({ server: null, session: null }),
      signIn: (session) => set({ session, server: session.server, expired: false }),
      signOut: () => set({ session: null, expired: false }),
      expire: () => set((s) => (s.session ? { session: null, expired: true } : s)),
    }),
    {
      name: storageKeys.session,
      partialize: ({ server, session }) => ({ server, session }),
    },
  ),
)
