import { Play, Shuffle } from 'lucide-react'
import type { Track } from '../../core/model/library'
import { playTracks, type PlaySource } from '../../playback'

/** Botones "Reproducir" y "Aleatorio" de álbumes y playlists (fondo surface, contenido en acento). */
export function PlayButtons({ tracks, source }: { tracks: Track[] | undefined; source: PlaySource | null }) {
  const disabled = !tracks?.length || !source
  const base =
    'flex h-12 items-center justify-center gap-2 rounded-xl bg-surface font-semibold text-accent active:opacity-70 disabled:opacity-50'
  return (
    <div className="mt-5 grid w-full grid-cols-2 gap-3">
      <button type="button" disabled={disabled} className={base} onClick={() => tracks && source && playTracks(tracks, 0, source)}>
        <Play size={20} fill="currentColor" aria-hidden />
        Reproducir
      </button>
      <button
        type="button"
        disabled={disabled}
        className={base}
        onClick={() => tracks && source && playTracks(tracks, -1, source, { shuffle: true })}
      >
        <Shuffle size={20} aria-hidden />
        Aleatorio
      </button>
    </div>
  )
}
