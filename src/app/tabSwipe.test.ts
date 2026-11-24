import { describe, expect, it } from 'vitest'
import { swipeTarget } from './tabSwipe'

describe('swipeTarget', () => {
  it('izquierda = siguiente pestaña, derecha = anterior', () => {
    expect(swipeTarget('/', -120, 5, 200)).toBe('/library')
    expect(swipeTarget('/library', -120, 5, 200)).toBe('/search')
    expect(swipeTarget('/library', 120, 5, 200)).toBe('/')
  })

  it('no da la vuelta en los extremos', () => {
    expect(swipeTarget('/', 120, 0, 200)).toBeNull()
    expect(swipeTarget('/search', -120, 0, 200)).toBeNull()
  })

  it('ignora toques cortos, verticales, lentos o fuera de las pestañas', () => {
    expect(swipeTarget('/', -40, 0, 200)).toBeNull()
    expect(swipeTarget('/', -120, 90, 200)).toBeNull()
    expect(swipeTarget('/', -120, 0, 1500)).toBeNull()
    expect(swipeTarget('/album/1', -120, 0, 200)).toBeNull()
  })
})
