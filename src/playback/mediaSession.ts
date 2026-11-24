// Media Session API: título, artista y portada en la notificación, pantalla de bloqueo y Bluetooth,
// con botones de reproducir/pausar, anterior/siguiente y adelantar.
import { imageUrl } from '../core/data/images'
import { useSessionStore } from '../core/session/sessionStore'
import { next, pause, play, previous, seek } from './controller'
import { currentTrack, usePlayerStore, type PlayerState } from './playerStore'

const ARTWORK_SIZES = [96, 192, 256, 512]

export function setupMediaSession(): () => void {
  if (!('mediaSession' in navigator)) return () => {}
  const ms = navigator.mediaSession

  const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
    ['play', () => play()],
    ['pause', () => pause()],
    ['previoustrack', () => previous()],
    ['nexttrack', () => next()],
    ['seekto', (d) => d.seekTime != null && seek(d.seekTime * 1000)],
    ['seekbackward', (d) => seek(usePlayerStore.getState().positionMs - (d.seekOffset ?? 10) * 1000)],
    ['seekforward', (d) => seek(usePlayerStore.getState().positionMs + (d.seekOffset ?? 10) * 1000)],
    ['stop', () => pause()],
  ]
  for (const [action, handler] of handlers) {
    try {
      ms.setActionHandler(action, handler)
    } catch {
      // Acción no soportada por este navegador.
    }
  }

  let lastTrackId: string | null = null
  let lastPositionUpdate = 0

  const update = (s: PlayerState) => {
    const track = currentTrack(s)
    if (track?.id !== lastTrackId) {
      lastTrackId = track?.id ?? null
      const server = useSessionStore.getState().session?.server.url
      ms.metadata = track
        ? new MediaMetadata({
            title: track.name,
            artist: track.artistName,
            album: track.albumName,
            artwork:
              track.image && server
                ? ARTWORK_SIZES.map((size) => ({
                    src: imageUrl(server, track.image!, size / Math.min(window.devicePixelRatio || 1, 3)),
                    sizes: `${size}x${size}`,
                  }))
                : [],
          })
        : null
    }
    ms.playbackState = !track ? 'none' : s.playWhenReady ? 'playing' : 'paused'

    const now = Date.now()
    if (track && s.durationMs > 0 && now - lastPositionUpdate > 1000) {
      lastPositionUpdate = now
      try {
        ms.setPositionState({
          duration: s.durationMs / 1000,
          position: Math.min(s.positionMs, s.durationMs) / 1000,
          playbackRate: 1,
        })
      } catch {
        // Valores fuera de rango durante cambios de canción.
      }
    }
  }

  update(usePlayerStore.getState())
  return usePlayerStore.subscribe(update)
}
