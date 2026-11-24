// API pública del reproductor para la UI. Coordina cola (queue.ts), estado (playerStore) y audio (engine.ts).
import type { Track } from '../core/model/library'
import {
  getAudio,
  hasSource,
  loadTrack,
  pauseAudio,
  playAudio,
  seekAudio,
  setAudioVolume,
  setEngineHandlers,
  stopEngine,
} from './engine'
import { initialPlayerState, usePlayerStore, type PlaySource } from './playerStore'
import { createQueue, nextIndex, nextRepeat, previousIndex, RESTART_THRESHOLD_MS, toggleShuffle as shuffleQueue } from './queue'

const get = usePlayerStore.getState
const set = usePlayerStore.setState

/** Reproduce una lista (álbum, playlist…) desde `startIndex`. */
export function playTracks(tracks: Track[], startIndex: number, source: PlaySource, opts: { shuffle?: boolean } = {}) {
  if (tracks.length === 0) return
  const { repeat } = get()
  const queue = createQueue(tracks, startIndex, opts.shuffle ?? false, repeat)
  set({ ...queue, source })
  void loadCurrent(true, 0)
}

function loadCurrent(autoplay: boolean, startMs: number) {
  const s = get()
  const track = s.queue[s.index]
  if (!track) return Promise.resolve()
  return loadTrack(track, { autoplay, startMs })
}

export function play() {
  const s = get()
  if (s.queue.length === 0) return
  // Sin audio cargado (cola restaurada al abrir la app o tras un error): se carga y se retoma la posición.
  if (!hasSource() || s.status === 'error') void loadCurrent(true, s.status === 'error' ? 0 : s.positionMs)
  else void playAudio()
}

export function pause() {
  pauseAudio()
}

export function togglePlay() {
  if (get().playWhenReady) pause()
  else play()
}

/** Siguiente canción. `auto` = la anterior terminó sola. */
export function next(auto = false) {
  const s = get()
  const idx = nextIndex(s, auto)
  if (idx === null) {
    // Fin de la cola: se queda en la última, en pausa y al inicio.
    pauseAudio()
    seekAudio(0)
    set({ status: 'paused' })
    return
  }
  if (idx === s.index) {
    seekAudio(0)
    void playAudio()
    return
  }
  set({ index: idx })
  void loadCurrent(auto || s.playWhenReady, 0)
}

export function previous() {
  const s = get()
  if (s.positionMs > RESTART_THRESHOLD_MS) return seekAudio(0)
  const idx = previousIndex(s)
  if (idx === null) return seekAudio(0)
  set({ index: idx })
  void loadCurrent(s.playWhenReady, 0)
}

export function jumpTo(index: number) {
  if (!get().queue[index]) return
  set({ index })
  void loadCurrent(true, 0)
}

export function seek(ms: number) {
  const { durationMs } = get()
  seekAudio(Math.max(0, Math.min(ms, durationMs || ms)))
}

export function toggleShuffle() {
  set(shuffleQueue(get()))
}

export function cycleRepeat() {
  set({ repeat: nextRepeat(get().repeat) })
}

export function setVolume(volume: number) {
  setAudioVolume(Math.max(0, Math.min(1, volume)))
}

/** Detiene y vacía el reproductor (al cerrar sesión). */
export function resetPlayer() {
  stopEngine()
  set({ ...initialPlayerState, volume: get().volume })
}

let fatalSkipTimer: number | undefined

setEngineHandlers({
  ended: () => next(true),
  // Si una canción no se puede reproducir y el usuario quería escuchar, se pasa a la siguiente.
  fatalError: () => {
    window.clearTimeout(fatalSkipTimer)
    const s = get()
    if (!s.playWhenReady || nextIndex(s, false) === null) return
    fatalSkipTimer = window.setTimeout(() => {
      if (get().status === 'error') next()
    }, 1500)
  },
})

/** Aplica el volumen guardado al elemento de audio. */
export function applyStoredVolume() {
  getAudio().volume = get().volume
}

// ---------- Cola editable ----------

/** Copias: cada entrada de la cola es un objeto distinto aunque sea la misma canción (claves estables al reordenar). */
const copies = (tracks: Track[]) => tracks.map((t) => ({ ...t }))

/** Inserta canciones justo después de la actual. Si no hay cola, empieza a sonar. */
export function playNext(tracks: Track[], source: PlaySource) {
  const s = get()
  if (s.queue.length === 0) return playTracks(tracks, 0, source)
  const items = copies(tracks)
  const queue = [...s.queue.slice(0, s.index + 1), ...items, ...s.queue.slice(s.index + 1)]
  const current = s.queue[s.index]
  const originalIndex = current ? s.originalQueue.indexOf(current) : -1
  const originalQueue =
    originalIndex === -1
      ? [...s.originalQueue, ...items]
      : [...s.originalQueue.slice(0, originalIndex + 1), ...items, ...s.originalQueue.slice(originalIndex + 1)]
  set({ queue, originalQueue })
}

/** Agrega canciones al final de la cola. Si no hay cola, empieza a sonar. */
export function addToQueue(tracks: Track[], source: PlaySource) {
  const s = get()
  if (s.queue.length === 0) return playTracks(tracks, 0, source)
  const items = copies(tracks)
  set({ queue: [...s.queue, ...items], originalQueue: [...s.originalQueue, ...items] })
}

/** Quita una canción de la cola (no la que suena). */
export function removeFromQueue(index: number) {
  const s = get()
  const item = s.queue[index]
  if (!item || index === s.index) return
  set({
    queue: s.queue.filter((_, i) => i !== index),
    originalQueue: s.originalQueue.filter((t) => t !== item),
    index: index < s.index ? s.index - 1 : s.index,
  })
}

/** Reemplaza el orden de lo que sigue (después de la canción actual), p. ej. tras arrastrar. */
export function reorderUpcoming(upcoming: Track[]) {
  const s = get()
  const queue = [...s.queue.slice(0, s.index + 1), ...upcoming]
  // Sin aleatorio, el orden elegido pasa a ser el "original" (no se pierde al alternar el aleatorio).
  set(s.shuffle ? { queue } : { queue, originalQueue: queue })
}
