// Reporta a Jellyfin lo que se escucha: inicio, progreso (cada 10 s y en pausa/seek) y fin.
// Así el servidor actualiza "reproducido", contadores y "Escuchado recientemente".
import type { Api } from '@jellyfin/sdk'
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api/session-api'
import { createSessionApi } from '../core/api/sessionApi'
import { useSessionStore } from '../core/session/sessionStore'
import { usePlayerStore, type PlaybackSession, type PlayerState } from './playerStore'

const PROGRESS_INTERVAL_MS = 10_000
/** Un salto de posición mayor que esto (fuera del avance normal) se considera seek. */
const SEEK_JUMP_MS = 2500

const ticks = (ms: number) => Math.round(ms * 10_000)

let api: Api | null = null
let apiToken: string | null = null

function getApi(): Api | null {
  const session = useSessionStore.getState().session
  if (!session) return null
  if (!api || apiToken !== session.accessToken) {
    api = createSessionApi(session)
    apiToken = session.accessToken
  }
  return api
}

/** Errores de reporte no deben afectar la reproducción. */
const quiet = (p: Promise<unknown>) => void p.catch(() => {})

interface Active {
  session: PlaybackSession
  started: boolean
  positionMs: number
}

let active: Active | null = null

function base(a: Active) {
  return {
    ItemId: a.session.itemId,
    PlaySessionId: a.session.playSessionId ?? undefined,
    MediaSourceId: a.session.mediaSourceId ?? undefined,
    PositionTicks: ticks(a.positionMs),
  }
}

function reportStart(a: Active, paused: boolean) {
  const client = getApi()
  if (!client) return
  a.started = true
  quiet(
    getSessionApi(client).reportPlaybackStart({
      playbackStartInfo: { ...base(a), PlayMethod: a.session.playMethod, CanSeek: true, IsPaused: paused },
    }),
  )
}

function reportProgress(a: Active, paused: boolean) {
  const client = getApi()
  if (!client || !a.started) return
  quiet(
    getSessionApi(client).reportPlaybackProgress({
      playbackProgressInfo: { ...base(a), PlayMethod: a.session.playMethod, CanSeek: true, IsPaused: paused },
    }),
  )
}

function reportStopped(a: Active) {
  const client = getApi()
  if (!client || !a.started) return
  quiet(getSessionApi(client).reportPlaybackStopped({ playbackStopInfo: base(a) }))
}

/** Al cerrar la pestaña/app: aviso de fin con fetch keepalive (sobrevive a la descarga de la página). */
function reportStoppedOnExit() {
  const client = getApi()
  if (!client || !active?.started) return
  try {
    void fetch(`${client.basePath.replace(/\/+$/, '')}/Sessions/Playing/Stopped`, {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json', Authorization: client.authorizationHeader },
      body: JSON.stringify(base(active)),
    })
  } catch {
    // ignorar
  }
}

function onChange(s: PlayerState, prev: PlayerState) {
  // Cambió la canción (o se detuvo todo): fin de la anterior con su última posición.
  if (s.playSession !== prev.playSession) {
    if (active && active.session !== s.playSession) {
      active.positionMs = prev.positionMs
      reportStopped(active)
      active = null
    }
    if (s.playSession && !active) active = { session: s.playSession, started: false, positionMs: s.positionMs }
  }
  if (!active) return

  const jumped = Math.abs(s.positionMs - active.positionMs) > SEEK_JUMP_MS
  active.positionMs = s.positionMs

  if (!active.started) {
    if (s.status === 'playing') reportStart(active, false)
    return
  }
  if (s.playWhenReady !== prev.playWhenReady) reportProgress(active, !s.playWhenReady)
  else if (jumped) reportProgress(active, !s.playWhenReady)
}

export function setupReporting(): () => void {
  const unsubscribe = usePlayerStore.subscribe(onChange)
  const timer = window.setInterval(() => {
    const s = usePlayerStore.getState()
    if (active?.started && s.playWhenReady) reportProgress(active, false)
  }, PROGRESS_INTERVAL_MS)
  window.addEventListener('pagehide', reportStoppedOnExit)
  return () => {
    unsubscribe()
    window.clearInterval(timer)
    window.removeEventListener('pagehide', reportStoppedOnExit)
  }
}
