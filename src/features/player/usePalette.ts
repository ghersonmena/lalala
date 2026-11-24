import { useEffect, useState } from 'react'
import { useImageUrl } from '../../core/data/images'
import type { ImageRef } from '../../core/model/library'
import type { ResolvedTheme } from '../../core/theme/themeStore'

export interface PlayerColors {
  background: string
  /** Color base del texto y controles sobre el degradado. */
  foreground: string
}

// Degradado del prototipo, usado mientras se calcula la paleta o si la portada no se puede leer.
const FALLBACK: Record<ResolvedTheme, PlayerColors> = {
  dark: { background: 'linear-gradient(180deg, #7E3854 0%, #4E2457 45%, #18101C 100%)', foreground: '#FFFFFF' },
  light: { background: 'linear-gradient(180deg, #F2D3DF 0%, #E6D6EE 45%, #F5F5F7 100%)', foreground: '#111114' },
}

type Hsl = [number, number, number]
const cache = new Map<string, Hsl | null>()

const hsl = ([h, s]: Hsl, sat: number, light: number) =>
  `hsl(${Math.round(h * 360)} ${Math.round(Math.min(s, sat) * 100)}% ${light}%)`

function gradient(base: Hsl, theme: ResolvedTheme): PlayerColors {
  // Saturación y luminosidad acotadas: el texto siempre tiene buen contraste.
  if (theme === 'dark') {
    return {
      background: `linear-gradient(180deg, ${hsl(base, 0.6, 32)} 0%, ${hsl(base, 0.45, 20)} 45%, ${hsl(base, 0.25, 7)} 100%)`,
      foreground: '#FFFFFF',
    }
  }
  return {
    background: `linear-gradient(180deg, ${hsl(base, 0.55, 84)} 0%, ${hsl(base, 0.4, 91)} 45%, ${hsl(base, 0.15, 97)} 100%)`,
    foreground: '#111114',
  }
}

/** Colores del reproductor calculados de la portada con node-vibrant (cargado bajo demanda). */
export function usePalette(image: ImageRef | null, theme: ResolvedTheme): PlayerColors {
  const url = useImageUrl(image, 64)
  const [result, setResult] = useState<{ url: string; color: Hsl | null } | null>(null)

  useEffect(() => {
    if (!url || cache.has(url)) return
    let cancelled = false
    void (async () => {
      try {
        const { Vibrant } = await import('node-vibrant/browser')
        const palette = await Vibrant.from(url).getPalette()
        const swatch = palette.Vibrant ?? palette.DarkVibrant ?? palette.Muted ?? palette.DarkMuted
        cache.set(url, swatch ? (swatch.hsl as Hsl) : null)
      } catch {
        cache.set(url, null) // p. ej. la imagen no permite leerse por CORS
      }
      if (!cancelled) setResult({ url, color: cache.get(url) ?? null })
    })()
    return () => {
      cancelled = true
    }
  }, [url])

  const color = url ? (cache.get(url) ?? (result?.url === url ? result.color : null)) : null
  return color ? gradient(color, theme) : FALLBACK[theme]
}
