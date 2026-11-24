import { describe, expect, it } from 'vitest'
import { navDirection } from './navTransitions'

describe('navDirection', () => {
  it('entrar a un detalle desliza desde la derecha', () => {
    expect(navDirection('PUSH', '/', '/album/1')).toBe('push')
    expect(navDirection('PUSH', '/album/1', '/artist/2')).toBe('push')
  })

  it('regresar desliza al revés', () => {
    expect(navDirection('POP', '/album/1', '/')).toBe('pop')
    expect(navDirection('POP', '/artist/2', '/album/1')).toBe('pop')
  })

  it('tocar una pestaña hace fundido, venga de donde venga', () => {
    expect(navDirection('PUSH', '/', '/library')).toBe('tab')
    expect(navDirection('PUSH', '/album/1', '/search')).toBe('tab')
    expect(navDirection('POP', '/library', '/')).toBe('tab')
  })
})

describe('deslizar entre pestañas', () => {
  it('la dirección sigue al dedo', () => {
    expect(navDirection('PUSH', '/', '/library', 'next')).toBe('tab-next')
    expect(navDirection('PUSH', '/library', '/', 'prev')).toBe('tab-prev')
  })
})
