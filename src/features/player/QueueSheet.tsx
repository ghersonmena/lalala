import { ChevronDown, GripVertical, Repeat, Repeat1, Shuffle, X } from 'lucide-react'
import { motion, Reorder, useDragControls } from 'motion/react'
import { formatDuration } from '../../core/format'
import { Cover } from '../../core/ui/Cover'
import type { Track } from '../../core/model/library'
import { cycleRepeat, jumpTo, removeFromQueue, reorderUpcoming, toggleShuffle, usePlayerStore } from '../../playback'
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

        <p className="mt-1 text-[0.8125rem] opacity-60">Arrastra para reordenar · toca para saltar</p>
        <div className="no-scrollbar mt-2 flex-1 overflow-y-auto">
          {upcoming.length === 0 && <p className="mt-10 text-center text-sm opacity-60">No hay más canciones en la cola.</p>}
          <Reorder.Group axis="y" values={upcoming} onReorder={reorderUpcoming} as="ol">
            {upcoming.map((t, i) => (
              <QueueItem key={keyOf(t)} track={t} onPlay={() => jumpTo(index + 1 + i)} onRemove={() => removeFromQueue(index + 1 + i)} />
            ))}
          </Reorder.Group>
        </div>
      </div>
    </motion.div>
  )
}

// Clave estable por entrada de la cola (cada entrada es un objeto distinto).
const keys = new WeakMap<Track, number>()
let nextKey = 0
function keyOf(track: Track): number {
  let key = keys.get(track)
  if (key === undefined) {
    key = nextKey++
    keys.set(track, key)
  }
  return key
}

function QueueItem({ track, onPlay, onRemove }: { track: Track; onPlay: () => void; onRemove: () => void }) {
  const controls = useDragControls()
  return (
    <Reorder.Item value={track} dragListener={false} dragControls={controls} className="relative flex items-center gap-1 rounded-lg" whileDrag={{ scale: 1.02, backgroundColor: 'rgba(127,127,127,0.28)' }}>
      <button type="button" onClick={onPlay} className="flex min-h-14 min-w-0 flex-1 items-center gap-3 py-1.5 text-left active:opacity-60">
        <Cover image={track.image} size={44} className="w-11 rounded-md" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.9375rem]">{track.name}</span>
          <span className="block truncate text-[0.8125rem] opacity-60">{track.artistName}</span>
        </span>
        <span className="text-xs tabular-nums opacity-60">{formatDuration(track.durationMs)}</span>
      </button>
      <button type="button" onClick={onRemove} aria-label={`Quitar de la cola: ${track.name}`} className="flex size-10 items-center justify-center opacity-60">
        <X size={18} aria-hidden />
      </button>
      <span
        onPointerDown={(e) => controls.start(e)}
        aria-hidden
        className="flex size-10 cursor-grab touch-none items-center justify-center opacity-60 active:cursor-grabbing"
      >
        <GripVertical size={20} />
      </span>
    </Reorder.Item>
  )
}
