import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { formatDuration } from '../format'
import type { ImageRef, Track } from '../model/library'
import { useNowPlaying } from '../../playback/useNowPlaying'
import { Cover } from './Cover'
import { Equalizer } from './Equalizer'

/** Botón "atrás" en acento, arriba a la izquierda. Si no hay historial, va a `fallback`. */
export function BackButton({ label = 'Atrás', fallback = '/' }: { label?: string; fallback?: string }) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => void (window.history.state?.idx > 0 ? navigate(-1) : navigate(fallback, { replace: true, viewTransition: true }))}
      className="-ml-2 flex h-12 items-center text-[1.0625rem] text-accent"
    >
      <ChevronLeft size={26} strokeWidth={2} aria-hidden />
      {label}
    </button>
  )
}

/** Pantalla de lista secundaria (Álbumes, Artistas…): atrás + título grande. */
export function SubScreen({ title, back, children }: { title: string; back?: string; children: ReactNode }) {
  return (
    <main className="px-5 pt-[max(env(safe-area-inset-top),8px)]">
      <BackButton label={back} />
      <h1 className="screen-title pb-3">{title}</h1>
      {children}
    </main>
  )
}

interface MediaRowProps {
  to: string
  title: string
  subtitle?: string
  image?: ImageRef | null
  icon?: LucideIcon
  round?: boolean
}

/** Fila con portada/ícono, título, subtítulo y chevron (artistas, playlists, géneros). */
export function MediaRow({ to, title, subtitle, image, icon, round }: MediaRowProps) {
  return (
    <li>
      <Link to={to} viewTransition className="flex min-h-16 items-center gap-3 active:opacity-70">
        {image !== undefined && (
          <Cover image={image} size={48} className="w-12 rounded-md" round={round} fallbackIcon={icon} />
        )}
        <div className="min-w-0 flex-1 border-b border-divider py-3">
          <p className="truncate text-base">{title}</p>
          {subtitle && <p className="truncate text-[0.8125rem] text-text-secondary">{subtitle}</p>}
        </div>
        <ChevronRight size={20} className="shrink-0 text-text-tertiary" aria-hidden />
      </Link>
    </li>
  )
}

/** Canción en lista general (Canciones, playlists): portada + título + artista + duración. Tocarla la reproduce. */
export function TrackRow({ track, onPlay }: { track: Track; onPlay?: () => void }) {
  const { active, playing } = useNowPlaying(track.id)
  return (
    <li>
      <button
        type="button"
        onClick={onPlay}
        aria-current={active ? 'true' : undefined}
        className="flex min-h-16 w-full items-center gap-3 text-left active:opacity-60"
      >
        <span className="relative shrink-0">
          <Cover image={track.image} size={48} className="w-12 rounded-md" />
          {active && (
            <span className="absolute inset-0 flex items-center justify-center rounded-md bg-black/45">
              <Equalizer playing={playing} className="text-white" />
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1 border-b border-divider py-3">
          <span className={`block truncate text-base ${active ? 'text-accent' : ''}`}>{track.name}</span>
          <span className="block truncate text-[0.8125rem] text-text-secondary">
            {track.artistName}
            {track.albumName && ` · ${track.albumName}`}
          </span>
        </span>
        <span className="shrink-0 text-[0.8125rem] text-text-tertiary tabular-nums">{formatDuration(track.durationMs)}</span>
      </button>
    </li>
  )
}
