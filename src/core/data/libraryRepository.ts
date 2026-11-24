import type { Api } from '@jellyfin/sdk'
import {
  BaseItemKind,
  CollectionType,
  ImageType,
  ItemFields,
  ItemFilter,
  ItemSortBy,
  MediaType,
  SortOrder,
  type BaseItemDtoQueryResult,
} from '@jellyfin/sdk/lib/generated-client/models'
import { getArtistApi } from '@jellyfin/sdk/lib/utils/api/artist-api'
import { getGenreApi } from '@jellyfin/sdk/lib/utils/api/genre-api'
import { getInstantMixApi } from '@jellyfin/sdk/lib/utils/api/instant-mix-api'
import { getLyricApi } from '@jellyfin/sdk/lib/utils/api/lyric-api'
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api'
import { getPlaylistApi } from '@jellyfin/sdk/lib/utils/api/playlist-api'
import { getUserViewApi } from '@jellyfin/sdk/lib/utils/api/user-view-api'
import type { Album, Artist, Genre, MusicLibrary, Page, Playlist, Track } from '../model/library'
import { isAxiosError } from 'axios'
import { albumFromTrack, ticksToMs, toAlbum, toArtist, toGenre, toPlaylist, toTrack, uniqueAlbums } from './mappers'

/** Contexto de cada consulta: Api autenticada, usuario y biblioteca elegida (undefined = todas). */
export interface LibraryContext {
  api: Api
  userId: string
  libraryId?: string
}

export interface PageRequest {
  startIndex: number
  limit: number
}

// Solo pedimos lo que la UI usa (más rápido en bibliotecas grandes).
const ALBUM_FIELDS = [ItemFields.Genres]
const TRACK_FIELDS = [ItemFields.MediaSources]
const IMAGE_OPTS = { enableImageTypes: [ImageType.Primary], imageTypeLimit: 1 }

function toPage<T>(result: BaseItemDtoQueryResult, map: (i: NonNullable<BaseItemDtoQueryResult['Items']>[number]) => T, startIndex: number): Page<T> {
  const items = (result.Items ?? []).map(map)
  return { items, total: result.TotalRecordCount ?? items.length, startIndex }
}

/** Bibliotecas de música a las que el usuario tiene acceso. */
export async function getMusicLibraries({ api, userId }: LibraryContext): Promise<MusicLibrary[]> {
  const { data } = await getUserViewApi(api).getUserViews({ userId })
  return (data.Items ?? [])
    .filter((v) => v.CollectionType === CollectionType.Music && v.Id)
    .map((v) => ({ id: v.Id!, name: v.Name ?? 'Música' }))
}

export async function getRecentlyAddedAlbums(ctx: LibraryContext, page: PageRequest): Promise<Page<Album>> {
  const { data } = await getLibraryApi(ctx.api).getItems({
    userId: ctx.userId,
    parentId: ctx.libraryId,
    includeItemTypes: [BaseItemKind.MusicAlbum],
    recursive: true,
    sortBy: [ItemSortBy.DateCreated],
    sortOrder: [SortOrder.Descending],
    fields: ALBUM_FIELDS,
    ...IMAGE_OPTS,
    ...page,
  })
  return toPage(data, toAlbum, page.startIndex)
}

/**
 * Álbumes escuchados recientemente. Jellyfin guarda la fecha de reproducción por canción,
 * así que se consultan las últimas canciones y se agrupan por álbum.
 */
export async function getRecentlyPlayedAlbums(ctx: LibraryContext, limit: number): Promise<Album[]> {
  const { data } = await getLibraryApi(ctx.api).getItems({
    userId: ctx.userId,
    parentId: ctx.libraryId,
    includeItemTypes: [BaseItemKind.Audio],
    recursive: true,
    filters: [ItemFilter.IsPlayed],
    sortBy: [ItemSortBy.DatePlayed],
    sortOrder: [SortOrder.Descending],
    limit: Math.max(limit * 5, 50),
    enableTotalRecordCount: false,
    ...IMAGE_OPTS,
  })
  return uniqueAlbums((data.Items ?? []).map(albumFromTrack)).slice(0, limit)
}

export async function getAlbums(ctx: LibraryContext, page: PageRequest): Promise<Page<Album>> {
  const { data } = await getLibraryApi(ctx.api).getItems({
    userId: ctx.userId,
    parentId: ctx.libraryId,
    includeItemTypes: [BaseItemKind.MusicAlbum],
    recursive: true,
    sortBy: [ItemSortBy.SortName],
    sortOrder: [SortOrder.Ascending],
    fields: ALBUM_FIELDS,
    ...IMAGE_OPTS,
    ...page,
  })
  return toPage(data, toAlbum, page.startIndex)
}

export async function getArtists(ctx: LibraryContext, page: PageRequest): Promise<Page<Artist>> {
  const { data } = await getArtistApi(ctx.api).getAlbumArtists({
    userId: ctx.userId,
    parentId: ctx.libraryId,
    sortBy: [ItemSortBy.SortName],
    sortOrder: [SortOrder.Ascending],
    ...IMAGE_OPTS,
    ...page,
  })
  return toPage(data, toArtist, page.startIndex)
}

export async function getTracks(ctx: LibraryContext, page: PageRequest): Promise<Page<Track>> {
  const { data } = await getLibraryApi(ctx.api).getItems({
    userId: ctx.userId,
    parentId: ctx.libraryId,
    includeItemTypes: [BaseItemKind.Audio],
    recursive: true,
    sortBy: [ItemSortBy.SortName],
    sortOrder: [SortOrder.Ascending],
    ...IMAGE_OPTS,
    ...page,
  })
  return toPage(data, toTrack, page.startIndex)
}

/** Playlists de audio del usuario (no dependen de la biblioteca elegida). */
export async function getPlaylists(ctx: LibraryContext): Promise<Playlist[]> {
  const { data } = await getLibraryApi(ctx.api).getItems({
    userId: ctx.userId,
    includeItemTypes: [BaseItemKind.Playlist],
    recursive: true,
    sortBy: [ItemSortBy.SortName],
    sortOrder: [SortOrder.Ascending],
    fields: [ItemFields.ChildCount, ItemFields.CumulativeRunTimeTicks],
    ...IMAGE_OPTS,
  })
  // Las playlists de video no aplican a una app de música.
  return (data.Items ?? []).filter((p) => p.MediaType !== MediaType.Video).map(toPlaylist)
}

export async function getGenres(ctx: LibraryContext, page: PageRequest): Promise<Page<Genre>> {
  const { data } = await getGenreApi(ctx.api).getGenres({
    userId: ctx.userId,
    parentId: ctx.libraryId,
    includeItemTypes: [BaseItemKind.MusicAlbum],
    sortBy: [ItemSortBy.SortName],
    sortOrder: [SortOrder.Ascending],
    enableImages: false,
    ...page,
  })
  return toPage(data, toGenre, page.startIndex)
}

export async function getGenreAlbums(ctx: LibraryContext, genreId: string, page: PageRequest): Promise<Page<Album>> {
  const { data } = await getLibraryApi(ctx.api).getItems({
    userId: ctx.userId,
    parentId: ctx.libraryId,
    includeItemTypes: [BaseItemKind.MusicAlbum],
    recursive: true,
    genreIds: [genreId],
    sortBy: [ItemSortBy.SortName],
    sortOrder: [SortOrder.Ascending],
    fields: ALBUM_FIELDS,
    ...IMAGE_OPTS,
    ...page,
  })
  return toPage(data, toAlbum, page.startIndex)
}

async function getItem(ctx: LibraryContext, itemId: string) {
  const { data } = await getLibraryApi(ctx.api).getItem({ itemId, userId: ctx.userId })
  return data
}

export async function getAlbum(ctx: LibraryContext, albumId: string): Promise<Album> {
  return toAlbum(await getItem(ctx, albumId))
}

export async function getArtist(ctx: LibraryContext, artistId: string): Promise<Artist> {
  return toArtist(await getItem(ctx, artistId))
}

export async function getGenre(ctx: LibraryContext, genreId: string): Promise<Genre> {
  return toGenre(await getItem(ctx, genreId))
}

export async function getPlaylist(ctx: LibraryContext, playlistId: string): Promise<Playlist> {
  return toPlaylist(await getItem(ctx, playlistId))
}

export async function getAlbumTracks(ctx: LibraryContext, albumId: string): Promise<Track[]> {
  const { data } = await getLibraryApi(ctx.api).getItems({
    userId: ctx.userId,
    parentId: albumId,
    includeItemTypes: [BaseItemKind.Audio],
    sortBy: [ItemSortBy.ParentIndexNumber, ItemSortBy.IndexNumber, ItemSortBy.SortName],
    sortOrder: [SortOrder.Ascending],
    fields: TRACK_FIELDS,
    enableImages: false,
  })
  return (data.Items ?? []).map(toTrack)
}

/** Álbumes donde el artista es artista del álbum, del más reciente al más viejo. */
export async function getArtistAlbums(ctx: LibraryContext, artistId: string): Promise<Album[]> {
  const { data } = await getLibraryApi(ctx.api).getItems({
    userId: ctx.userId,
    includeItemTypes: [BaseItemKind.MusicAlbum],
    recursive: true,
    albumArtistIds: [artistId],
    sortBy: [ItemSortBy.ProductionYear, ItemSortBy.SortName],
    sortOrder: [SortOrder.Descending, SortOrder.Ascending],
    fields: ALBUM_FIELDS,
    ...IMAGE_OPTS,
  })
  return (data.Items ?? []).map(toAlbum)
}

export async function getPlaylistTracks(ctx: LibraryContext, playlistId: string, page: PageRequest): Promise<Page<Track>> {
  const { data } = await getPlaylistApi(ctx.api).getPlaylistItems({
    playlistId,
    userId: ctx.userId,
    ...IMAGE_OPTS,
    ...page,
  })
  return toPage(data, toTrack, page.startIndex)
}

// ---------- Hecho para ti ----------

/** Canciones favoritas del usuario (GET /Items?Filters=IsFavorite). */
export async function getFavoriteTracks(ctx: LibraryContext, page: PageRequest): Promise<Page<Track>> {
  const { data } = await getLibraryApi(ctx.api).getItems({
    userId: ctx.userId,
    parentId: ctx.libraryId,
    includeItemTypes: [BaseItemKind.Audio],
    recursive: true,
    filters: [ItemFilter.IsFavorite],
    sortBy: [ItemSortBy.AlbumArtist, ItemSortBy.Album, ItemSortBy.ParentIndexNumber, ItemSortBy.IndexNumber],
    sortOrder: [SortOrder.Ascending],
    ...IMAGE_OPTS,
    ...page,
  })
  return toPage(data, toTrack, page.startIndex)
}

export interface Mix {
  tracks: Track[]
  /** En qué se basó el mix (para el subtítulo), p. ej. el nombre de la canción semilla. */
  basedOn: string | null
}

const MIX_SIZE = 60

/**
 * "Mix de la semana": Instant Mix de Jellyfin a partir de la canción que más has escuchado.
 * Si aún no hay historial, se basa en el álbum agregado más recientemente.
 */
export async function getWeeklyMix(ctx: LibraryContext): Promise<Mix> {
  const mixApi = getInstantMixApi(ctx.api)
  const { data: top } = await getLibraryApi(ctx.api).getItems({
    userId: ctx.userId,
    parentId: ctx.libraryId,
    includeItemTypes: [BaseItemKind.Audio],
    recursive: true,
    filters: [ItemFilter.IsPlayed],
    sortBy: [ItemSortBy.PlayCount, ItemSortBy.DatePlayed],
    sortOrder: [SortOrder.Descending, SortOrder.Descending],
    limit: 1,
    enableTotalRecordCount: false,
    enableImages: false,
  })
  const seed = top.Items?.[0]
  if (seed?.Id) {
    const { data } = await mixApi.getInstantMixFromSong({ itemId: seed.Id, userId: ctx.userId, limit: MIX_SIZE, ...IMAGE_OPTS })
    return { tracks: (data.Items ?? []).map(toTrack), basedOn: seed.Name ?? null }
  }
  const latest = (await getRecentlyAddedAlbums(ctx, { startIndex: 0, limit: 1 })).items[0]
  if (!latest) return { tracks: [], basedOn: null }
  const { data } = await mixApi.getInstantMixFromAlbum({ itemId: latest.id, userId: ctx.userId, limit: MIX_SIZE, ...IMAGE_OPTS })
  return { tracks: (data.Items ?? []).map(toTrack), basedOn: latest.name }
}

// ---------- Letras ----------

export interface LyricLine {
  text: string
  /** Inicio de la línea en ms (solo en letras sincronizadas). */
  startMs: number | null
}

export interface Lyrics {
  synced: boolean
  lines: LyricLine[]
}

/** GET /Audio/{id}/Lyrics. null si la canción no tiene letra. */
export async function getLyrics(ctx: LibraryContext, itemId: string): Promise<Lyrics | null> {
  try {
    const { data } = await getLyricApi(ctx.api).getLyrics({ itemId })
    const lines = (data.Lyrics ?? []).map((l) => ({
      text: l.Text ?? '',
      startMs: l.Start != null ? ticksToMs(l.Start) : null,
    }))
    if (lines.length === 0) return null
    return { synced: lines.some((l) => l.startMs !== null && l.startMs > 0), lines }
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return null
    throw error
  }
}
