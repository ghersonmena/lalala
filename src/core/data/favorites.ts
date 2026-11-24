import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api'
import { getUserDataApi } from '@jellyfin/sdk/lib/utils/api/user-data-api'
import { useQueryClient } from '@tanstack/react-query'
import { create } from 'zustand'
import { createSessionApi } from '../api/sessionApi'
import type { Track } from '../model/library'
import { useSessionStore } from '../session/sessionStore'

/**
 * Cambios de favorito hechos en esta sesión (optimistas). Ganan sobre el valor que trae cada
 * canción, así el corazón se actualiza al instante en todas las pantallas.
 */
const useFavoriteOverrides = create<{ overrides: Record<string, boolean> }>()(() => ({ overrides: {} }))

const setOverride = (id: string, value: boolean) =>
  useFavoriteOverrides.setState((s) => ({ overrides: { ...s.overrides, [id]: value } }))

export function useIsFavorite(track: Pick<Track, 'id' | 'isFavorite'> | null): boolean {
  const override = useFavoriteOverrides((s) => (track ? s.overrides[track.id] : undefined))
  return override ?? track?.isFavorite ?? false
}

/** POST/DELETE /UserFavoriteItems/{id}. */
export async function setFavorite(itemId: string, favorite: boolean): Promise<void> {
  const session = useSessionStore.getState().session
  if (!session) return
  const api = getUserDataApi(createSessionApi(session))
  const params = { itemId, userId: session.userId }
  if (favorite) await api.markFavoriteItem(params)
  else await api.unmarkFavoriteItem(params)
}

/** Lee de Jellyfin si la canción está marcada como favorita (GET /Items/{id}, sin caché). */
export async function readFavorite(itemId: string): Promise<boolean | null> {
  const session = useSessionStore.getState().session
  if (!session) return null
  const { data } = await getLibraryApi(createSessionApi(session)).getItem(
    { itemId, userId: session.userId },
    { params: { _: Date.now() } },
  )
  return data.UserData?.IsFavorite ?? null
}

export interface FavoriteResult {
  /** Estado final (el que confirmó Jellyfin, o el anterior si falló). */
  favorite: boolean
  /** request = la petición falló; not-saved = Jellyfin respondió OK pero no lo guardó. */
  problem: null | 'request' | 'not-saved'
}

/**
 * Alterna el favorito con actualización optimista. Después vuelve a leer la canción en Jellyfin
 * para confirmar que se guardó; si no, revierte el corazón y lo informa en `problem`.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient()
  return async (track: Pick<Track, 'id' | 'isFavorite'>, current: boolean): Promise<FavoriteResult> => {
    const next = !current
    setOverride(track.id, next)
    try {
      await setFavorite(track.id, next)
    } catch (error) {
      console.warn('[favoritos] la petición a Jellyfin falló', track.id, error)
      setOverride(track.id, current)
      return { favorite: current, problem: 'request' }
    }
    void queryClient.invalidateQueries({ queryKey: ['favorites'] })
    try {
      const saved = await readFavorite(track.id)
      if (saved !== null && saved !== next) {
        console.warn('[favoritos] Jellyfin respondió OK pero la canción quedó con IsFavorite =', saved, track.id)
        setOverride(track.id, saved)
        return { favorite: saved, problem: 'not-saved' }
      }
    } catch {
      // No se pudo confirmar (p. ej. sin red): se queda el valor optimista.
    }
    return { favorite: next, problem: null }
  }
}

export function clearFavoriteOverrides() {
  useFavoriteOverrides.setState({ overrides: {} })
}
