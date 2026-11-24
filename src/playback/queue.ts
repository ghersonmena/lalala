// Lógica pura de la cola de reproducción (sin audio ni React), fácil de probar.
import type { Track } from '../core/model/library'

export type RepeatMode = 'off' | 'all' | 'one'

export interface QueueState {
  queue: Track[]
  /** Orden original (sin aleatorio), para restaurarlo al desactivar el aleatorio. */
  originalQueue: Track[]
  index: number
  shuffle: boolean
  repeat: RepeatMode
}

/** Fisher–Yates; `random` inyectable para tests. */
export function shuffled<T>(items: T[], random: () => number = Math.random): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

/** Cola nueva. Con aleatorio, la canción elegida (o una al azar) suena primero y el resto se mezcla. */
export function createQueue(
  tracks: Track[],
  startIndex: number,
  shuffle: boolean,
  repeat: RepeatMode,
  random: () => number = Math.random,
): QueueState {
  if (!shuffle) return { queue: tracks, originalQueue: tracks, index: clamp(startIndex, tracks.length), shuffle, repeat }
  const first = tracks[startIndex] ?? tracks[Math.floor(random() * tracks.length)]
  const rest = shuffled(
    tracks.filter((t) => t !== first),
    random,
  )
  return { queue: first ? [first, ...rest] : rest, originalQueue: tracks, index: 0, shuffle, repeat }
}

/** Activa/desactiva el aleatorio sin interrumpir la canción actual. */
export function toggleShuffle(state: QueueState, random: () => number = Math.random): QueueState {
  const current = state.queue[state.index]
  if (!state.shuffle) {
    const rest = shuffled(
      state.originalQueue.filter((t) => t !== current),
      random,
    )
    return { ...state, shuffle: true, queue: current ? [current, ...rest] : rest, index: 0 }
  }
  const index = current ? state.originalQueue.indexOf(current) : 0
  return { ...state, shuffle: false, queue: state.originalQueue, index: Math.max(0, index) }
}

export function nextRepeat(mode: RepeatMode): RepeatMode {
  return mode === 'off' ? 'all' : mode === 'all' ? 'one' : 'off'
}

/**
 * Índice siguiente. `auto` = terminó la canción (respeta "repetir una").
 * null = se acabó la cola.
 */
export function nextIndex(state: QueueState, auto: boolean): number | null {
  const { index, queue, repeat } = state
  if (queue.length === 0) return null
  if (auto && repeat === 'one') return index
  if (index + 1 < queue.length) return index + 1
  return repeat === 'off' ? null : 0
}

/** Índice anterior; null = reiniciar la canción actual. */
export function previousIndex(state: QueueState): number | null {
  const { index, queue, repeat } = state
  if (index > 0) return index - 1
  return repeat === 'all' && queue.length > 1 ? queue.length - 1 : null
}

/** Pasados 3 s, "anterior" reinicia la canción en vez de saltar (como en la mayoría de reproductores). */
export const RESTART_THRESHOLD_MS = 3000

function clamp(i: number, length: number) {
  return Math.min(Math.max(0, i), Math.max(0, length - 1))
}
