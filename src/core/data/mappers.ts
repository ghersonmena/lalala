import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import type { Album, Artist, ArtistRef, Genre, ImageRef, Playlist, Track } from '../model/library'

/** Jellyfin mide el tiempo en ticks: 1 tick = 100 ns. */
export const ticksToMs = (ticks: number | null | undefined) => (ticks ? Math.round(ticks / 10_000) : 0)

function primaryImage(item: BaseItemDto): ImageRef | null {
  const tag = item.ImageTags?.Primary
  return item.Id && tag ? { itemId: item.Id, tag } : null
}

function refs(pairs: BaseItemDto['AlbumArtists']): ArtistRef[] {
  return (pairs ?? []).flatMap((p) => (p.Id ? [{ id: p.Id, name: p.Name ?? '' }] : []))
}

export function toAlbum(item: BaseItemDto): Album {
  const artists = refs(item.AlbumArtists)
  return {
    id: item.Id ?? '',
    name: item.Name ?? 'Álbum sin título',
    artistName: item.AlbumArtist || artists.map((a) => a.name).join(', ') || 'Artista desconocido',
    artists,
    year: item.ProductionYear ?? null,
    genres: item.Genres ?? [],
    image: primaryImage(item),
  }
}

/** Álbum derivado de una canción (para "Escuchado recientemente", que se consulta por canciones). */
export function albumFromTrack(item: BaseItemDto): Album | null {
  if (!item.AlbumId) return null
  return {
    id: item.AlbumId,
    name: item.Album ?? 'Álbum sin título',
    artistName: item.AlbumArtist || 'Artista desconocido',
    artists: refs(item.AlbumArtists),
    year: item.ProductionYear ?? null,
    genres: [],
    image: item.AlbumPrimaryImageTag ? { itemId: item.AlbumId, tag: item.AlbumPrimaryImageTag } : null,
  }
}

export function toTrack(item: BaseItemDto): Track {
  const artistName = item.Artists?.length ? item.Artists.join(', ') : item.AlbumArtist || 'Artista desconocido'
  const ownImage = primaryImage(item)
  const albumImage =
    item.AlbumId && item.AlbumPrimaryImageTag ? { itemId: item.AlbumId, tag: item.AlbumPrimaryImageTag } : null
  return {
    id: item.Id ?? '',
    name: item.Name ?? 'Canción sin título',
    albumId: item.AlbumId ?? null,
    albumName: item.Album ?? '',
    artistName,
    albumArtistName: item.AlbumArtist ?? artistName,
    durationMs: ticksToMs(item.RunTimeTicks),
    trackNumber: item.IndexNumber ?? null,
    discNumber: item.ParentIndexNumber ?? null,
    container: (item.Container ?? item.MediaSources?.[0]?.Container ?? null)?.toLowerCase() ?? null,
    image: ownImage ?? albumImage,
    isFavorite: item.UserData?.IsFavorite ?? false,
    hasLyrics: item.HasLyrics ?? null,
  }
}

export function toArtist(item: BaseItemDto): Artist {
  return { id: item.Id ?? '', name: item.Name ?? 'Artista desconocido', image: primaryImage(item) }
}

export function toPlaylist(item: BaseItemDto): Playlist {
  return {
    id: item.Id ?? '',
    name: item.Name ?? 'Playlist',
    trackCount: item.ChildCount ?? null,
    durationMs: ticksToMs(item.CumulativeRunTimeTicks ?? item.RunTimeTicks),
    image: primaryImage(item),
  }
}

export function toGenre(item: BaseItemDto): Genre {
  return { id: item.Id ?? '', name: item.Name ?? 'Género' }
}

/** Quita álbumes repetidos conservando el orden (el primero gana). */
export function uniqueAlbums(albums: (Album | null)[]): Album[] {
  const seen = new Set<string>()
  const out: Album[] = []
  for (const a of albums) {
    if (a && !seen.has(a.id)) {
      seen.add(a.id)
      out.push(a)
    }
  }
  return out
}
