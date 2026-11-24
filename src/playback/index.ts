import { useSessionStore } from '../core/session/sessionStore'
import { applyStoredVolume, resetPlayer } from './controller'
import { setupMediaSession } from './mediaSession'
import { setupReporting } from './reporting'
import { clearSavedPlayback, restorePlayback, setupPersistence } from './persistence'

let initialized = false

/** Arranca el reproductor una sola vez: restaura la cola guardada, Media Session y guardado automático. */
export function initPlayback() {
  if (initialized) return
  initialized = true
  restorePlayback()
  applyStoredVolume()
  setupMediaSession()
  setupPersistence()
  setupReporting()
  // Si la sesión se cierra (logout o token revocado), se detiene el audio.
  useSessionStore.subscribe((s, prev) => {
    if (prev.session && !s.session) resetPlayer()
    if (s.session && prev.session?.userId !== s.session.userId) restorePlayback()
  })
}

/** Cierre de sesión explícito: además de detener, borra la cola guardada. */
export function forgetPlayback() {
  resetPlayer()
  clearSavedPlayback()
}

export * from './controller'
export { currentTrack, isPlaying, usePlayerStore, type PlaySource } from './playerStore'
export { useNowPlaying } from './useNowPlaying'
