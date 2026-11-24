import { beforeEach, describe, expect, it } from 'vitest'
import type { Track } from '../core/model/library'
import { addToQueue, playNext, removeFromQueue, reorderUpcoming, toggleShuffle } from './controller'
import { initialPlayerState, usePlayerStore } from './playerStore'

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
const ids = () => usePlayerStore.getState().queue.map((t) => t.id)
const source = { type: 'album' as const, id: 'x', name: 'X' }

beforeEach(() => {
  const queue = ['a', 'b', 'c', 'd'].map(track)
  usePlayerStore.setState({ ...initialPlayerState, queue, originalQueue: queue, index: 1 })
})

describe('cola editable', () => {
  it('reproducir a continuación inserta después de la actual', () => {
    playNext([track('x'), track('y')], source)
    expect(ids()).toEqual(['a', 'b', 'x', 'y', 'c', 'd'])
    expect(usePlayerStore.getState().index).toBe(1)
  })

  it('agregar a la cola va al final', () => {
    addToQueue([track('z')], source)
    expect(ids()).toEqual(['a', 'b', 'c', 'd', 'z'])
  })

  it('quitar una canción anterior ajusta el índice; la actual no se puede quitar', () => {
    removeFromQueue(0)
    expect(ids()).toEqual(['b', 'c', 'd'])
    expect(usePlayerStore.getState().index).toBe(0)
    removeFromQueue(0)
    expect(ids()).toEqual(['b', 'c', 'd'])
  })

  it('reordenar lo que sigue se conserva al alternar el aleatorio', () => {
    const [, , c, d] = usePlayerStore.getState().queue
    reorderUpcoming([d!, c!])
    expect(ids()).toEqual(['a', 'b', 'd', 'c'])
    toggleShuffle()
    toggleShuffle()
    expect(ids()).toEqual(['a', 'b', 'd', 'c'])
  })

  it('la misma canción agregada dos veces son entradas distintas', () => {
    addToQueue([track('a')], source)
    const q = usePlayerStore.getState().queue
    expect(q[0]).not.toBe(q[4])
  })
})
