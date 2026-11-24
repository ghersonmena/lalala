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

/** Alterna el favorito con actualización optimista; si el servidor falla, se revierte. */
export function useToggleFavorite() {
  const queryClient = useQueryClient()
  return async (track: Pick<Track, 'id' | 'isFavorite'>, current: boolean) => {
    const next = !current
    setOverride(track.id, next)
    try {
      await setFavorite(track.id, next)
      void queryClient.invalidateQueries({ queryKey: ['favorites'] })
      return next
    } catch {
      setOverride(track.id, current)
      return current
    }
  }
}

export function clearFavoriteOverrides() {
  useFavoriteOverrides.setState({ overrides: {} })
}
