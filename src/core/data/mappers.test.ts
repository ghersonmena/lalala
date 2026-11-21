import { describe, expect, it } from 'vitest'
import { formatDuration, formatTotalDuration, songsLabel } from '../format'
import { albumFromTrack, ticksToMs, toAlbum, toTrack, uniqueAlbums } from './mappers'

describe('mappers', () => {
  it('convierte ticks de Jellyfin a milisegundos', () => {
    expect(ticksToMs(1_850_000_000)).toBe(185_000)
    expect(ticksToMs(undefined)).toBe(0)
  })

  it('mapea un álbum con artista, año, géneros y portada', () => {
    const album = toAlbum({
      Id: 'a1',
      Name: 'Disco',
      AlbumArtist: 'Banda',
      AlbumArtists: [{ Id: 'ar1', Name: 'Banda' }],
      ProductionYear: 2021,
      Genres: ['Rock'],
      ImageTags: { Primary: 'tag1' },
    })
    expect(album).toEqual({
      id: 'a1',
      name: 'Disco',
      artistName: 'Banda',
      artists: [{ id: 'ar1', name: 'Banda' }],
      year: 2021,
      genres: ['Rock'],
      image: { itemId: 'a1', tag: 'tag1' },
    })
  })

  it('una canción sin portada propia usa la del álbum y normaliza el formato', () => {
    const track = toTrack({
      Id: 't1',
      Name: 'Canción',
      AlbumId: 'a1',
      AlbumPrimaryImageTag: 'tagA',
      Artists: ['Uno', 'Dos'],
      RunTimeTicks: 2_000_000_000,
      IndexNumber: 3,
      ParentIndexNumber: 1,
      Container: 'FLAC',
    })
    expect(track.image).toEqual({ itemId: 'a1', tag: 'tagA' })
    expect(track.artistName).toBe('Uno, Dos')
    expect(track.durationMs).toBe(200_000)
    expect(track.container).toBe('flac')
  })

  it('agrupa canciones escuchadas en álbumes únicos conservando el orden', () => {
    const albums = uniqueAlbums([
      albumFromTrack({ AlbumId: 'b', Album: 'B' }),
      albumFromTrack({ AlbumId: 'a', Album: 'A' }),
      albumFromTrack({ AlbumId: 'b', Album: 'B' }),
      albumFromTrack({ Name: 'sin álbum' }),
    ])
    expect(albums.map((a) => a.id)).toEqual(['b', 'a'])
  })
})

describe('format', () => {
  it('duraciones', () => {
    expect(formatDuration(187_000)).toBe('3:07')
    expect(formatDuration(3_765_000)).toBe('1:02:45')
    expect(formatTotalDuration(42 * 60_000)).toBe('42 min')
    expect(formatTotalDuration(65 * 60_000)).toBe('1 h 5 min')
    expect(songsLabel(1)).toBe('1 canción')
    expect(songsLabel(12)).toBe('12 canciones')
  })
})
