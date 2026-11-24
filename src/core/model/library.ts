// Modelos de dominio de la biblioteca. La UI solo conoce estos tipos (nunca los DTOs del SDK).

/** Referencia a una imagen de Jellyfin; la URL final se arma con `imageUrl()` según el tamaño. */
export interface ImageRef {
  itemId: string
  tag: string
}

export interface MusicLibrary {
  id: string
  name: string
}

export interface ArtistRef {
  id: string
  name: string
}

export interface Album {
  id: string
  name: string
  /** Texto del artista del álbum tal como lo da Jellyfin (puede ser "Varios artistas"). */
  artistName: string
  artists: ArtistRef[]
  year: number | null
  genres: string[]
  image: ImageRef | null
}

export interface Track {
  id: string
  name: string
  albumId: string | null
  albumName: string
  artistName: string
  albumArtistName: string
  durationMs: number
  trackNumber: number | null
  discNumber: number | null
  /** Contenedor/formato del archivo (flac, mp3, m4a…), si se conoce. */
  container: string | null
  image: ImageRef | null
  /** Marcada como favorita en Jellyfin (puede faltar en colas guardadas antiguas). */
  isFavorite?: boolean
  /** Jellyfin indica si tiene letra; null = desconocido. */
  hasLyrics?: boolean | null
}

export interface Artist {
  id: string
  name: string
  image: ImageRef | null
}

export interface Playlist {
  id: string
  name: string
  trackCount: number | null
  durationMs: number
  image: ImageRef | null
}

export interface Genre {
  id: string
  name: string
}

export interface Page<T> {
  items: T[]
  total: number
  startIndex: number
}
