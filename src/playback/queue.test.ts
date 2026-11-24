import { describe, expect, it } from 'vitest'
import type { Track } from '../core/model/library'
import { createQueue, nextIndex, nextRepeat, previousIndex, toggleShuffle } from './queue'

const track = (id: string): Track => ({
  id,
  name: id,
  albumId: null,
  albumName: '',
  artistName: '',
  albumArtistName: '',
  durationMs: 1000,
  trackNumber: null,
  discNumber: null,
  container: null,
  image: null,
})
const tracks = ['a', 'b', 'c', 'd', 'e'].map(track)
const ids = (ts: Track[]) => ts.map((t) => t.id)
// "random" determinista
const seq = () => {
  let i = 0
  return () => [0.1, 0.7, 0.3, 0.9, 0.5][i++ % 5]!
}

describe('cola', () => {
  it('sin aleatorio respeta el orden y el índice elegido', () => {
    const q = createQueue(tracks, 2, false, 'off')
    expect(ids(q.queue)).toEqual(['a', 'b', 'c', 'd', 'e'])
    expect(q.index).toBe(2)
  })

  it('con aleatorio la canción elegida suena primero y no se pierde ninguna', () => {
    const q = createQueue(tracks, 3, true, 'off', seq())
    expect(q.queue[0]!.id).toBe('d')
    expect(q.index).toBe(0)
    expect(ids(q.queue).sort()).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('desactivar el aleatorio vuelve al orden original en la canción actual', () => {
    const shuffledQ = createQueue(tracks, 1, true, 'off', seq())
    const playingSecond = { ...shuffledQ, index: 2 }
    const current = playingSecond.queue[2]!
    const restored = toggleShuffle(playingSecond)
    expect(ids(restored.queue)).toEqual(['a', 'b', 'c', 'd', 'e'])
    expect(restored.queue[restored.index]).toBe(current)
  })

  it('activar el aleatorio deja la actual al principio', () => {
    const q = toggleShuffle(createQueue(tracks, 2, false, 'off'), seq())
    expect(q.shuffle).toBe(true)
    expect(q.queue[0]!.id).toBe('c')
    expect(q.index).toBe(0)
  })

  it('siguiente: avanza, termina o vuelve al inicio según "repetir"', () => {
    const last = { ...createQueue(tracks, 4, false, 'off') }
    expect(nextIndex(last, true)).toBeNull()
    expect(nextIndex({ ...last, repeat: 'all' }, true)).toBe(0)
    expect(nextIndex({ ...last, repeat: 'one' }, true)).toBe(4)
    // Saltar manualmente con "repetir una" sí avanza
    expect(nextIndex({ ...last, index: 1, repeat: 'one' }, false)).toBe(2)
  })

  it('anterior: retrocede o reinicia en la primera', () => {
    const q = createQueue(tracks, 0, false, 'off')
    expect(previousIndex(q)).toBeNull()
    expect(previousIndex({ ...q, repeat: 'all' })).toBe(4)
    expect(previousIndex({ ...q, index: 3 })).toBe(2)
  })

  it('repetir cicla off → todas → una → off', () => {
    expect(nextRepeat('off')).toBe('all')
    expect(nextRepeat('all')).toBe('one')
    expect(nextRepeat('one')).toBe('off')
  })
})
