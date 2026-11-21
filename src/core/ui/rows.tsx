import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { formatDuration } from '../format'
import type { ImageRef, Track } from '../model/library'
import { Cover } from './Cover'

/** Botón "atrás" en acento, arriba a la izquierda. Si no hay historial, va a `fallback`. */
export function BackButton({ label = 'Atrás', fallback = '/' }: { label?: string; fallback?: string }) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => void (window.history.state?.idx > 0 ? navigate(-1) : navigate(fallback, { replace: true }))}
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
      <Link to={to} className="flex min-h-16 items-center gap-3 active:opacity-70">
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

/** Canción en lista general (Canciones, playlists): portada + título + artista + duración. */
export function TrackRow({ track }: { track: Track }) {
  return (
    <li className="flex min-h-16 items-center gap-3">
      <Cover image={track.image} size={48} className="w-12 rounded-md" />
      <div className="min-w-0 flex-1 border-b border-divider py-3">
        <p className="truncate text-base">{track.name}</p>
        <p className="truncate text-[0.8125rem] text-text-secondary">
          {track.artistName}
          {track.albumName && ` · ${track.albumName}`}
        </p>
      </div>
      <span className="shrink-0 text-[0.8125rem] text-text-tertiary tabular-nums">{formatDuration(track.durationMs)}</span>
    </li>
  )
}
