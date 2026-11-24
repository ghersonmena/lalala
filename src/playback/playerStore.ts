import { create } from 'zustand'
import type { Track } from '../core/model/library'
import type { QueueState, RepeatMode } from './queue'

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

/** De dónde viene la cola (para "REPRODUCIENDO DESDE EL ÁLBUM …"). */
export interface PlaySource {
  type: 'album' | 'playlist' | 'artist' | 'songs' | 'genre' | 'mix' | 'favorites'
  id: string | null
  name: string
}

/** Sesión de reproducción actual en Jellyfin (para reportar lo que se escucha). */
export interface PlaybackSession {
  itemId: string
  playSessionId: string | null
  mediaSourceId: string | null
  playMethod: 'DirectPlay' | 'Transcode'
}

export interface PlayerState extends QueueState {
  source: PlaySource | null
  status: PlayerStatus
  /** El usuario quiere que suene (aunque esté cargando). Define el ícono play/pausa. */
  playWhenReady: boolean
  positionMs: number
  durationMs: number
  /** Insignia de formato/modo ("FLAC · DIRECT PLAY"). */
  badge: string | null
  error: string | null
  volume: number
  playSession: PlaybackSession | null
}

export const initialPlayerState: PlayerState = {
  queue: [],
  originalQueue: [],
  index: 0,
  shuffle: false,
  repeat: 'off' as RepeatMode,
  source: null,
  status: 'idle',
  playWhenReady: false,
  positionMs: 0,
  durationMs: 0,
  badge: null,
  error: null,
  volume: 1,
  playSession: null,
}

/**
 * Estado del reproductor. Solo lo modifican `controller.ts` y `engine.ts`;
 * la UI lo lee con selectores y llama a las funciones del controlador.
 */
export const usePlayerStore = create<PlayerState>()(() => initialPlayerState)

export const currentTrack = (s: PlayerState): Track | null => s.queue[s.index] ?? null
export const isPlaying = (s: PlayerState) => s.playWhenReady && s.status !== 'error'
