import { ChevronDown, Repeat, Repeat1, Shuffle } from 'lucide-react'
import { motion } from 'motion/react'
import { formatDuration } from '../../core/format'
import { Cover } from '../../core/ui/Cover'
import { cycleRepeat, jumpTo, toggleShuffle, usePlayerStore } from '../../playback'
import type { PlayerColors } from './usePalette'

/** Cola de reproducción: lo que sigue, con aleatorio y repetir. Tocar una canción salta a ella. */
export function QueueSheet({ onClose, colors }: { onClose: () => void; colors: PlayerColors }) {
  const queue = usePlayerStore((s) => s.queue)
  const index = usePlayerStore((s) => s.index)
  const shuffle = usePlayerStore((s) => s.shuffle)
  const repeat = usePlayerStore((s) => s.repeat)
  const upcoming = queue.slice(index + 1)
  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat

  return (
    <motion.div
      role="dialog"
      aria-label="Cola de reproducción"
      className="absolute inset-0 z-10 flex justify-center"
      style={{ background: colors.background, color: colors.foreground }}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 32, stiffness: 300 }}
    >
      <div className="flex h-full w-full max-w-[520px] flex-col px-5 pt-[max(env(safe-area-inset-top),10px)] pb-[max(env(safe-area-inset-bottom),12px)]">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onClose} aria-label="Cerrar cola" className="-ml-3 flex size-12 items-center justify-center">
            <ChevronDown size={28} aria-hidden />
          </button>
          <h2 className="flex-1 font-display text-xl font-extrabold">A continuación</h2>
          <button
            type="button"
            onClick={toggleShuffle}
            aria-pressed={shuffle}
            aria-label="Aleatorio"
            className={`flex size-11 items-center justify-center rounded-full transition-colors ${shuffle ? 'bg-current/20' : 'opacity-60'}`}
          >
            <Shuffle size={20} aria-hidden />
          </button>
          <button
            type="button"
            onClick={cycleRepeat}
            aria-pressed={repeat !== 'off'}
            aria-label={repeat === 'one' ? 'Repetir una' : repeat === 'all' ? 'Repetir todas' : 'Repetir desactivado'}
            className={`flex size-11 items-center justify-center rounded-full transition-colors ${repeat !== 'off' ? 'bg-current/20' : 'opacity-60'}`}
          >
            <RepeatIcon size={20} aria-hidden />
          </button>
        </div>

        <ol className="no-scrollbar mt-2 flex-1 overflow-y-auto">
          {upcoming.length === 0 && <p className="mt-10 text-center text-sm opacity-60">No hay más canciones en la cola.</p>}
          {upcoming.map((t, i) => (
            <li key={`${t.id}-${index + 1 + i}`}>
              <button
                type="button"
                onClick={() => jumpTo(index + 1 + i)}
                className="flex min-h-14 w-full items-center gap-3 py-1.5 text-left active:opacity-60"
              >
                <Cover image={t.image} size={44} className="w-11 rounded-md" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.9375rem]">{t.name}</span>
                  <span className="block truncate text-[0.8125rem] opacity-60">{t.artistName}</span>
                </span>
                <span className="text-xs tabular-nums opacity-60">{formatDuration(t.durationMs)}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </motion.div>
  )
}
