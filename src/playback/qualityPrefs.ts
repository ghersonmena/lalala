import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { storageKeys } from '../core/storage/storage'
import { DEFAULT_MAX_BITRATE } from './stream'

export type StreamQuality = 'original' | 320 | 256 | 192 | 128

export const QUALITY_OPTIONS: { value: StreamQuality; label: string }[] = [
  { value: 'original', label: 'Original' },
  { value: 320, label: 'Alta · 320 kbps' },
  { value: 256, label: '256 kbps' },
  { value: 192, label: 'Normal · 192 kbps' },
  { value: 128, label: 'Ahorro · 128 kbps' },
]

interface QualityState {
  wifi: StreamQuality
  cellular: StreamQuality
  setWifi: (q: StreamQuality) => void
  setCellular: (q: StreamQuality) => void
}

export const useQualityPrefs = create<QualityState>()(
  persist(
    (set) => ({
      wifi: 'original',
      cellular: 256,
      setWifi: (wifi) => set({ wifi }),
      setCellular: (cellular) => set({ cellular }),
    }),
    { name: storageKeys.playbackPrefs },
  ),
)

export function qualityToBitrate(q: StreamQuality): number {
  return q === 'original' ? DEFAULT_MAX_BITRATE : q * 1000
}

type NetworkInformation = { type?: string }

/** ¿Estamos con datos móviles? Solo algunos navegadores lo informan (Chrome en Android). */
export function isCellular(): boolean {
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection
  return connection?.type === 'cellular'
}

/** Bitrate máximo a pedir a Jellyfin según la conexión actual y los ajustes. */
export function currentMaxBitrate(): number {
  const { wifi, cellular } = useQualityPrefs.getState()
  return qualityToBitrate(isCellular() ? cellular : wifi)
}
