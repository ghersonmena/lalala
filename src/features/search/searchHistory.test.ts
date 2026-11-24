import { beforeEach, describe, expect, it } from 'vitest'
import { useSearchHistory } from './searchHistory'

beforeEach(() => useSearchHistory.setState({ recent: [] }))

describe('búsquedas recientes', () => {
  it('guarda la más nueva primero, sin repetidos (sin importar mayúsculas) y como máximo 8', () => {
    const { remember } = useSearchHistory.getState()
    for (const t of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']) remember(t)
    remember('  C ')
    const recent = useSearchHistory.getState().recent
    expect(recent[0]).toBe('C')
    expect(recent.filter((r) => r.toLowerCase() === 'c')).toHaveLength(1)
    expect(recent).toHaveLength(8)
  })

  it('ignora búsquedas vacías', () => {
    useSearchHistory.getState().remember('   ')
    expect(useSearchHistory.getState().recent).toEqual([])
  })
})
