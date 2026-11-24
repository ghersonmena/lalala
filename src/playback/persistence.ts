// Guarda la cola y la posición para restaurarlas al volver a abrir la app (sin reproducir solo).
import type { Track } from '../core/model/library'
import { readString, storageKeys, writeString } from '../core/storage/storage'
import { useSessionStore } from '../core/session/sessionStore'
import { usePlayerStore, type PlayerState, type PlaySource } from './playerStore'
import type { RepeatMode } from './queue'

interface Saved {
  owner: string
  queue: Track[]
  originalQueue: Track[]
  index: number
  shuffle: boolean
  repeat: RepeatMode
  source: PlaySource | null
  positionMs: number
  volume: number
}

// Colas enormes se recortan alrededor de la canción actual para no llenar el almacenamiento.
const MAX_SAVED = 1500

const ownerKey = () => {
  const s = useSessionStore.getState().session
  return s ? `${s.server.url}|${s.userId}` : null
}

export function restorePlayback() {
  const owner = ownerKey()
  const raw = readString(storageKeys.playback)
  if (!owner || !raw) return
  try {
    const saved = JSON.parse(raw) as Saved
    if (saved.owner !== owner || !saved.queue?.[saved.index]) {
      usePlayerStore.setState({ volume: saved.volume ?? 1 })
      return
    }
    usePlayerStore.setState({
      queue: saved.queue,
      originalQueue: saved.originalQueue?.length ? saved.originalQueue : saved.queue,
      index: saved.index,
      shuffle: saved.shuffle,
      repeat: saved.repeat,
      source: saved.source,
      positionMs: saved.positionMs,
      durationMs: saved.queue[saved.index]?.durationMs ?? 0,
      status: 'paused',
      playWhenReady: false,
      volume: saved.volume ?? 1,
    })
  } catch {
    // Datos corruptos: se ignoran.
  }
}

function save(s: PlayerState) {
  const owner = ownerKey()
  if (!owner) return
  let { queue, index } = s
  if (queue.length > MAX_SAVED) {
    const start = Math.max(0, Math.min(index - 200, queue.length - MAX_SAVED))
    queue = queue.slice(start, start + MAX_SAVED)
    index -= start
  }
  const saved: Saved = {
    owner,
    queue,
    originalQueue: s.originalQueue.length > MAX_SAVED || s.shuffle === false ? [] : s.originalQueue,
    index,
    shuffle: s.shuffle,
    repeat: s.repeat,
    source: s.source,
    positionMs: s.positionMs,
    volume: s.volume,
  }
  writeString(storageKeys.playback, JSON.stringify(saved))
}

/** Guarda al cambiar la cola/canción/modos y, como mucho cada 5 s, la posición. */
export function setupPersistence(): () => void {
  let lastSaved = 0
  let timer: number | undefined
  return usePlayerStore.subscribe((s, prev) => {
    if (s.queue.length === 0) return
    const structural =
      s.queue !== prev.queue || s.index !== prev.index || s.shuffle !== prev.shuffle || s.repeat !== prev.repeat ||
      s.volume !== prev.volume || (s.playWhenReady !== prev.playWhenReady && !s.playWhenReady)
    const now = Date.now()
    if (structural || now - lastSaved > 5000) {
      lastSaved = now
      window.clearTimeout(timer)
      timer = window.setTimeout(() => save(usePlayerStore.getState()), 0)
    }
  })
}

export function clearSavedPlayback() {
  try {
    localStorage.removeItem(storageKeys.playback)
  } catch {
    // ignorar
  }
}
