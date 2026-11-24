import { afterEach, describe, expect, it } from 'vitest'
import { currentMaxBitrate, qualityToBitrate, useQualityPrefs } from './qualityPrefs'
import { DEFAULT_MAX_BITRATE } from './stream'

const setConnection = (type?: string) =>
  Object.defineProperty(navigator, 'connection', { value: type ? { type } : undefined, configurable: true })

afterEach(() => setConnection(undefined))

describe('calidad de streaming', () => {
  it('convierte la calidad a bitrate', () => {
    expect(qualityToBitrate('original')).toBe(DEFAULT_MAX_BITRATE)
    expect(qualityToBitrate(192)).toBe(192_000)
  })

  it('usa la calidad de datos móviles solo con conexión celular', () => {
    useQualityPrefs.setState({ wifi: 'original', cellular: 128 })
    setConnection('wifi')
    expect(currentMaxBitrate()).toBe(DEFAULT_MAX_BITRATE)
    setConnection('cellular')
    expect(currentMaxBitrate()).toBe(128_000)
    setConnection(undefined) // navegador que no informa: se usa la de Wi-Fi
    expect(currentMaxBitrate()).toBe(DEFAULT_MAX_BITRATE)
  })
})
