import { describe, expect, it } from 'vitest'
import type { ChangelogEntry } from './changelog'
import { compareVersions, unseenEntries } from './versions'

const entry = (version: string): ChangelogEntry => ({ version, date: '2026-01-01', items: [] })
const entries = [entry('0.3.0'), entry('0.2.1'), entry('0.2.0'), entry('0.1.0')]

describe('compareVersions', () => {
  it('ordena por mayor, menor y parche', () => {
    expect(compareVersions('1.0.0', '0.9.9')).toBeGreaterThan(0)
    expect(compareVersions('0.10.0', '0.9.0')).toBeGreaterThan(0)
    expect(compareVersions('0.2.0', '0.2.1')).toBeLessThan(0)
    expect(compareVersions('0.2', '0.2.0')).toBe(0)
  })
})

describe('unseenEntries', () => {
  it('en el primer uso muestra solo la versión más reciente', () => {
    expect(unseenEntries(entries, null).map((e) => e.version)).toEqual(['0.3.0'])
  })

  it('muestra solo las versiones posteriores a la última vista', () => {
    expect(unseenEntries(entries, '0.2.0').map((e) => e.version)).toEqual(['0.3.0', '0.2.1'])
  })

  it('no muestra nada si ya vio la última', () => {
    expect(unseenEntries(entries, '0.3.0')).toEqual([])
  })
})
