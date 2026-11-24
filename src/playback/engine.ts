// Motor de audio: un único <audio> fuera de React. Usa direct play cuando el navegador
// soporta el formato y HLS (nativo o hls.js, cargado bajo demanda) cuando Jellyfin transcodifica.
import type Hls from 'hls.js'
import { createSessionApi } from '../core/api/sessionApi'
import { toAppError } from '../core/data/errors'
import type { Track } from '../core/model/library'
import { useSessionStore } from '../core/session/sessionStore'
import { supportsNativeHls } from './deviceProfile'
import { usePlayerStore } from './playerStore'
import { resolveStream, type StreamInfo } from './stream'

let audio: HTMLAudioElement | null = null
let hls: Hls | null = null
let stream: StreamInfo | null = null
/** Cada carga incrementa el token; las respuestas de cargas viejas se descartan. */
let loadToken = 0
let triedTranscode = false

type EndedHandler = () => void
let onEnded: EndedHandler = () => {}
let onFatalError: () => void = () => {}

export function setEngineHandlers(handlers: { ended: EndedHandler; fatalError: () => void }) {
  onEnded = handlers.ended
  onFatalError = handlers.fatalError
}

const set = usePlayerStore.setState

export function getAudio(): HTMLAudioElement {
  if (audio) return audio
  const el = new Audio()
  el.preload = 'auto'
  el.addEventListener('timeupdate', () => set({ positionMs: Math.round(el.currentTime * 1000) }))
  el.addEventListener('durationchange', () => {
    if (Number.isFinite(el.duration) && el.duration > 0) set({ durationMs: Math.round(el.duration * 1000) })
  })
  el.addEventListener('playing', () => set({ status: 'playing', playWhenReady: true, error: null }))
  el.addEventListener('pause', () => {
    if (!el.ended && usePlayerStore.getState().status !== 'loading') set({ status: 'paused', playWhenReady: false })
  })
  el.addEventListener('waiting', () => {
    if (usePlayerStore.getState().playWhenReady) set({ status: 'loading' })
  })
  el.addEventListener('ended', () => onEnded())
  el.addEventListener('error', () => void handleError())
  audio = el
  return el
}

/** iOS ignora `volume` (se controla con los botones físicos): en ese caso no mostramos el control. */
export function canSetVolume(): boolean {
  const probe = document.createElement('audio')
  probe.volume = 0.5
  return probe.volume === 0.5
}

function destroyHls() {
  hls?.destroy()
  hls = null
}

export function hasSource(): boolean {
  return !!audio?.currentSrc && stream !== null
}

/** Carga una canción (pide a Jellyfin el stream adecuado) y opcionalmente empieza a sonar. */
export async function loadTrack(track: Track, opts: { autoplay: boolean; startMs?: number; forceTranscode?: boolean }) {
  const token = ++loadToken
  const el = getAudio()
  const startMs = opts.startMs ?? 0
  if (!opts.forceTranscode) triedTranscode = false
  destroyHls()
  el.pause()
  stream = null
  set({
    status: 'loading',
    playWhenReady: opts.autoplay,
    positionMs: startMs,
    durationMs: track.durationMs,
    badge: null,
    error: null,
  })

  const session = useSessionStore.getState().session
  if (!session) return

  let info: StreamInfo
  try {
    info = await resolveStream({
      api: createSessionApi(session),
      userId: session.userId,
      itemId: track.id,
      forceTranscode: opts.forceTranscode,
    })
  } catch (error) {
    if (token !== loadToken) return
    set({ status: 'error', error: toAppError(error).message })
    onFatalError()
    return
  }
  if (token !== loadToken) return
  stream = info
  set({ badge: info.badge })

  const startAt = () => {
    if (startMs > 0) el.currentTime = startMs / 1000
  }

  if (info.kind === 'hls' && !supportsNativeHls(el)) {
    const { default: HlsClass } = await import('hls.js')
    if (token !== loadToken) return
    if (!HlsClass.isSupported()) {
      set({ status: 'error', error: 'Este navegador no puede reproducir el audio transcodificado.' })
      return
    }
    const instance = new HlsClass({ startPosition: startMs / 1000 })
    hls = instance
    instance.on(HlsClass.Events.ERROR, (_event, data) => {
      if (data.fatal && token === loadToken) void handleError()
    })
    instance.loadSource(info.url)
    instance.attachMedia(el)
  } else {
    el.src = info.url
    el.addEventListener('loadedmetadata', startAt, { once: true })
  }

  if (opts.autoplay) await playAudio()
}

/** play() con manejo del bloqueo de autoplay del navegador. */
export async function playAudio() {
  const el = getAudio()
  set({ playWhenReady: true })
  try {
    await el.play()
  } catch (error) {
    if ((error as DOMException)?.name === 'NotAllowedError') set({ status: 'paused', playWhenReady: false })
    // AbortError: se interrumpió por otra carga; se ignora.
  }
}

export function pauseAudio() {
  set({ playWhenReady: false })
  getAudio().pause()
}

export function seekAudio(ms: number) {
  const el = getAudio()
  if (hasSource()) el.currentTime = ms / 1000
  set({ positionMs: ms })
}

export function setAudioVolume(volume: number) {
  getAudio().volume = volume
  set({ volume })
}

/** Error de reproducción: si el original falló, se reintenta transcodificado; si no, se reporta. */
async function handleError() {
  const state = usePlayerStore.getState()
  const track = state.queue[state.index]
  if (!track || state.status === 'error') return
  if (stream?.kind === 'direct' && !triedTranscode) {
    triedTranscode = true
    await loadTrack(track, { autoplay: state.playWhenReady, startMs: state.positionMs, forceTranscode: true })
    return
  }
  set({ status: 'error', error: 'No se pudo reproducir esta canción.' })
  onFatalError()
}

/** Detiene todo y suelta el audio (al cerrar sesión). */
export function stopEngine() {
  loadToken++
  destroyHls()
  stream = null
  if (audio) {
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
  }
}
