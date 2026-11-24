import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api'
import { getPlaylistApi } from '@jellyfin/sdk/lib/utils/api/playlist-api'
import { MediaType } from '@jellyfin/sdk/lib/generated-client/models'
import type { QueryClient } from '@tanstack/react-query'
import { createSessionApi } from '../api/sessionApi'
import { useSessionStore } from '../session/sessionStore'

function playlistApi() {
  const session = useSessionStore.getState().session
  if (!session) throw new Error('Sin sesión')
  const base = createSessionApi(session)
  return { api: getPlaylistApi(base), library: getLibraryApi(base), userId: session.userId }
}

/** POST /Playlists: crea una playlist de audio (opcionalmente con canciones). Devuelve su id. */
export async function createPlaylist(name: string, trackIds: string[] = []): Promise<string> {
  const { api, userId } = playlistApi()
  const { data } = await api.createPlaylist({
    createPlaylistDto: { Name: name, Ids: trackIds, UserId: userId, MediaType: MediaType.Audio },
  })
  if (!data.Id) throw new Error('Jellyfin no devolvió la playlist creada')
  return data.Id
}

/** POST /Playlists/{id}/Items: agrega canciones al final de la playlist. */
export async function addToPlaylist(playlistId: string, trackIds: string[]): Promise<void> {
  const { api, userId } = playlistApi()
  await api.addItemToPlaylist({ playlistId, ids: trackIds, userId })
}

/**
 * DELETE /Playlists/{id}/Items: quita entradas de la playlist. Usa el id de la *entrada*
 * (`PlaylistItemId`), no el de la canción, por si la misma canción está repetida.
 */
export async function removeFromPlaylist(playlistId: string, entryIds: string[]): Promise<void> {
  const { api } = playlistApi()
  await api.removeItemFromPlaylist({ playlistId, entryIds })
}

/** POST /Playlists/{id}: cambia el nombre. */
export async function renamePlaylist(playlistId: string, name: string): Promise<void> {
  const { api } = playlistApi()
  await api.updatePlaylist({ playlistId, updatePlaylistDto: { Name: name } })
}

/** DELETE /Items/{id}: borra la playlist (Jellyfin solo lo permite a su dueño o a un admin). */
export async function deletePlaylist(playlistId: string): Promise<void> {
  const { library } = playlistApi()
  await library.deleteItem({ itemId: playlistId })
}

/** Refresca la lista de playlists y el detalle de la afectada. */
export function invalidatePlaylists(queryClient: QueryClient, playlistId?: string) {
  void queryClient.invalidateQueries({ queryKey: ['playlists'] })
  if (playlistId) {
    void queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] === 'playlist' || q.queryKey[0] === 'playlist-tracks') && q.queryKey.includes(playlistId) })
  }
}
