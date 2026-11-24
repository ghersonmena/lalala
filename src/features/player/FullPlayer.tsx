import {
  ChevronDown,
  Heart,
  ListMusic,
  MessageSquareQuote,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { AnimatePresence, motion, useDragControls, useReducedMotion } from 'motion/react'
import { useEffect, useState, type CSSProperties } from 'react'
import { useIsFavorite, useToggleFavorite } from '../../core/data/favorites'
import { formatDuration } from '../../core/format'
import type { Track } from '../../core/model/library'
import { useResolvedTheme } from '../../core/theme/useResolvedTheme'
import { Cover } from '../../core/ui/Cover'
import { Slider } from '../../core/ui/Slider'
import { canSetVolume } from '../../playback/engine'
import {
  currentTrack,
  isPlaying,
  next,
  previous,
  seek,
  setVolume,
  togglePlay,
  usePlayerStore,
  type PlaySource,
} from '../../playback'
import { LyricsView } from './LyricsView'
import { QueueSheet } from './QueueSheet'
import { usePalette } from './usePalette'
import { usePlayerSheet } from './usePlayerSheet'

const SOURCE_LABEL: Record<PlaySource['type'], string> = {
  album: 'Reproduciendo desde el álbum',
  playlist: 'Reproduciendo desde la playlist',
  artist: 'Reproduciendo del artista',
  songs: 'Reproduciendo desde',
  genre: 'Reproduciendo del género',
  mix: 'Reproduciendo',
  favorites: 'Reproduciendo desde',
}

/** Reproductor a pantalla completa: hoja que sube desde abajo y se cierra deslizando hacia abajo. */
export function FullPlayer() {
  const { open, closePlayer } = usePlayerSheet()
  const hasTrack = usePlayerStore((s) => s.queue.length > 0)
  const show = open && hasTrack

  // Bloquea el scroll de la página de fondo mientras está abierto.
  useEffect(() => {
    if (!show) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [show])

  return <AnimatePresence>{show && <PlayerSheet onClose={closePlayer} />}</AnimatePresence>
}

function PlayerSheet({ onClose }: { onClose: () => void }) {
  const track = usePlayerStore(currentTrack)
  const source = usePlayerStore((s) => s.source)
  const playing = usePlayerStore(isPlaying)
  const theme = useResolvedTheme()
  const colors = usePalette(track?.image ?? null, theme)
  const reduceMotion = useReducedMotion()
  const dragControls = useDragControls()
  const [queueOpen, setQueueOpen] = useState(false)
  const [showLyrics, setShowLyrics] = useState(false)
  const { closeAndGo } = usePlayerSheet()

  if (!track) return null

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Reproductor"
      className="fixed inset-0 z-50 flex justify-center overflow-hidden"
      style={{ background: colors.background, color: colors.foreground, transition: 'background 0.6s ease' } as CSSProperties}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={reduceMotion ? { duration: 0 } : { type: 'spring', damping: 32, stiffness: 300 }}
      drag="y"
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.7 }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 140 || info.velocity.y > 600) onClose()
      }}
    >
      <div className="flex h-full w-full max-w-[520px] flex-col px-6 pt-[max(env(safe-area-inset-top),10px)] pb-[max(env(safe-area-inset-bottom),16px)]">
        {/* Zona de arrastre: indicador + barra superior */}
        <div className="touch-none" onPointerDown={(e) => dragControls.start(e)}>
          <div className="mx-auto mt-1 h-[5px] w-9 rounded-full bg-current opacity-35" aria-hidden />
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar reproductor"
              className="-ml-3 flex size-12 items-center justify-center"
            >
              <ChevronDown size={28} aria-hidden />
            </button>
            <div className="min-w-0 flex-1 text-center">
              {source && (
                <>
                  <p className="label-caps truncate opacity-70">{SOURCE_LABEL[source.type]}</p>
                  {source.id && (source.type === 'album' || source.type === 'playlist') ? (
                    <button
                      type="button"
                      onClick={() => closeAndGo(`/${source.type}/${source.id}`)}
                      className="max-w-full truncate text-[0.8125rem] font-semibold"
                    >
                      {source.name}
                    </button>
                  ) : (
                    <p className="truncate text-[0.8125rem] font-semibold">{source.name}</p>
                  )}
                </>
              )}
            </div>
            <span className="size-12 shrink-0" aria-hidden />
          </div>
        </div>

        {showLyrics ? (
          <>
            {/* Con letras: encabezado compacto y las letras ocupan el espacio de la portada */}
            <div className="mt-3 flex items-center gap-3">
              <Cover image={track.image} size={56} className="w-14 rounded-lg" />
              <TrackTitle track={track} onArtist={() => track.albumId && closeAndGo(`/album/${track.albumId}`)} />
            </div>
            <div className="min-h-0 flex-1">
              <LyricsView track={track} />
            </div>
          </>
        ) : (
          <>
            {/* Portada: se encoge al pausar */}
            <div className="flex min-h-0 flex-1 items-center justify-center py-4">
              <motion.div
                className="aspect-square w-[min(336px,calc(100vw-48px),calc(100dvh-460px))] min-w-[160px]"
                animate={{ scale: playing ? 1 : 272 / 336 }}
                transition={reduceMotion ? { duration: 0 } : { type: 'spring', damping: 20, stiffness: 180 }}
              >
                <Cover
                  image={track.image}
                  size={336}
                  alt={`Portada de ${track.albumName}`}
                  className="w-full rounded-xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.55)]"
                />
              </motion.div>
            </div>
            <TrackTitle track={track} onArtist={() => track.albumId && closeAndGo(`/album/${track.albumId}`)} />
          </>
        )}

        <Progress />
        <Badge />

        <div className="mt-2 flex items-center justify-center gap-10">
          <button type="button" onClick={previous} aria-label="Anterior" className="flex size-14 items-center justify-center">
            <SkipBack size={34} fill="currentColor" aria-hidden />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? 'Pausar' : 'Reproducir'}
            className="flex size-[72px] items-center justify-center"
          >
            {playing ? (
              <Pause size={52} fill="currentColor" strokeWidth={1} aria-hidden />
            ) : (
              <Play size={52} fill="currentColor" strokeWidth={1} aria-hidden />
            )}
          </button>
          <button type="button" onClick={() => next()} aria-label="Siguiente" className="flex size-14 items-center justify-center">
            <SkipForward size={34} fill="currentColor" aria-hidden />
          </button>
        </div>

        <VolumeControl />

        {/* Fila inferior: Letras (activo = fondo sólido) y Cola */}
        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowLyrics((v) => !v)}
            aria-pressed={showLyrics}
            aria-label="Letras"
            className="flex size-12 items-center justify-center rounded-full transition-colors"
            style={showLyrics ? { background: colors.foreground, color: colors.inverse } : { opacity: 0.8 }}
          >
            <MessageSquareQuote size={22} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setQueueOpen(true)}
            aria-label="Cola de reproducción"
            className="flex size-12 items-center justify-center rounded-full opacity-80"
          >
            <ListMusic size={24} aria-hidden />
          </button>
        </div>
      </div>

      <AnimatePresence>{queueOpen && <QueueSheet onClose={() => setQueueOpen(false)} colors={colors} />}</AnimatePresence>
    </motion.div>
  )
}

/** Título + artista a la izquierda y corazón de favorito a la derecha. */
function TrackTitle({ track, onArtist }: { track: Track; onArtist: () => void }) {
  const favorite = useIsFavorite(track)
  const toggleFavorite = useToggleFavorite()
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-[1.375rem] font-semibold">{track.name}</h2>
        <button type="button" onClick={onArtist} className="block max-w-full truncate text-left text-[1.0625rem] opacity-70">
          {track.artistName}
        </button>
      </div>
      <motion.button
        type="button"
        onClick={() => void toggleFavorite(track, favorite)}
        aria-pressed={favorite}
        aria-label={favorite ? 'Quitar de favoritas' : 'Agregar a favoritas'}
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-current/12"
        whileTap={{ scale: 0.85 }}
      >
        <motion.span key={String(favorite)} initial={{ scale: favorite ? 0.4 : 1 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}>
          <Heart size={22} fill={favorite ? 'currentColor' : 'none'} aria-hidden />
        </motion.span>
      </motion.button>
    </div>
  )
}

function Progress() {
  const position = usePlayerStore((s) => s.positionMs)
  const duration = usePlayerStore((s) => s.durationMs)
  const [scrub, setScrub] = useState<number | null>(null)
  const shown = scrub ?? position

  return (
    <div className="mt-5">
      <Slider
        label="Progreso"
        value={Math.min(position, duration)}
        max={duration}
        step={1000}
        valueText={`${formatDuration(shown)} de ${formatDuration(duration)}`}
        onScrub={setScrub}
        onCommit={seek}
      />
      <div className="-mt-0.5 flex justify-between text-xs tabular-nums opacity-60">
        <span>{formatDuration(shown)}</span>
        <span>-{formatDuration(Math.max(0, duration - shown))}</span>
      </div>
    </div>
  )
}

function Badge() {
  const badge = usePlayerStore((s) => s.badge)
  const status = usePlayerStore((s) => s.status)
  const error = usePlayerStore((s) => s.error)
  const text = status === 'error' ? error : status === 'loading' && !badge ? 'Cargando…' : badge
  return (
    <div className="mt-1 flex h-6 justify-center">
      {text && (
        <span
          role={status === 'error' ? 'alert' : undefined}
          className="rounded-md bg-current/12 px-2 py-0.5 text-[0.6875rem] font-semibold tracking-[0.06em] uppercase"
        >
          <span className="opacity-80">{text}</span>
        </span>
      )}
    </div>
  )
}

const volumeSupported = typeof document !== 'undefined' && canSetVolume()

function VolumeControl() {
  const volume = usePlayerStore((s) => s.volume)
  if (!volumeSupported) return null
  const Icon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2
  return (
    <div className="mt-3 flex items-center gap-3 opacity-80">
      <button type="button" onClick={() => setVolume(volume === 0 ? 1 : 0)} aria-label={volume === 0 ? 'Activar sonido' : 'Silenciar'}>
        <Icon size={18} aria-hidden />
      </button>
      <Slider label="Volumen" value={Math.round(volume * 100)} max={100} onScrub={(v) => v !== null && setVolume(v / 100)} onCommit={(v) => setVolume(v / 100)} />
      <Volume2 size={18} aria-hidden />
    </div>
  )
}
