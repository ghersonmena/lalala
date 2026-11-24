import { Pause, Play, SkipForward } from 'lucide-react'
import { useLocation } from 'react-router'
import { Cover } from '../../core/ui/Cover'
import { currentTrack, isPlaying, next, togglePlay, usePlayerStore } from '../../playback'
import { usePlayerSheet } from './usePlayerSheet'

/** Mini-player persistente: flota 8px sobre la barra de navegación. */
export function MiniPlayer() {
  const track = usePlayerStore(currentTrack)
  const playing = usePlayerStore(isPlaying)
  const progress = usePlayerStore((s) => (s.durationMs > 0 ? Math.min(1, s.positionMs / s.durationMs) : 0))
  const { open, openPlayer } = usePlayerSheet()
  const { pathname } = useLocation()

  if (!track || open) return null
  const withNav = pathname !== '/settings'

  return (
    <div
      className="vt-mini fixed inset-x-0 z-40 mx-auto max-w-[520px] px-2.5"
      style={{
        bottom: withNav
          ? 'calc(max(env(safe-area-inset-bottom), 20px) + 64px + 8px)'
          : 'calc(max(env(safe-area-inset-bottom), 12px))',
      }}
    >
      <div className="relative flex h-16 items-center gap-3 overflow-hidden rounded-2xl bg-surface-elevated pr-1 pl-2.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.45)]">
        <button
          type="button"
          onClick={openPlayer}
          aria-label={`Abrir reproductor: ${track.name}`}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <Cover image={track.image} size={44} className="w-11 rounded-md" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.9375rem] font-medium">{track.name}</span>
            <span className="block truncate text-[0.8125rem] text-text-secondary">{track.artistName}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? 'Pausar' : 'Reproducir'}
          className="flex size-12 shrink-0 items-center justify-center"
        >
          {playing ? <Pause size={26} fill="currentColor" aria-hidden /> : <Play size={26} fill="currentColor" aria-hidden />}
        </button>
        <button
          type="button"
          onClick={() => next()}
          aria-label="Siguiente"
          className="flex size-12 shrink-0 items-center justify-center"
        >
          <SkipForward size={24} fill="currentColor" aria-hidden />
        </button>
        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-divider" aria-hidden>
          <span className="block h-full bg-accent" style={{ width: `${progress * 100}%` }} />
        </span>
      </div>
    </div>
  )
}
