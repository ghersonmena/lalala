import type { ImageRef } from '../model/library'
import { useSessionStore } from '../session/sessionStore'

/** Escala de píxeles del dispositivo, limitada para no pedir imágenes enormes. */
const dpr = () => Math.min(Math.ceil(typeof window === 'undefined' ? 2 : window.devicePixelRatio || 1), 3)

/** URL de una portada de Jellyfin al tamaño (en px CSS) en que se va a mostrar. */
export function imageUrl(serverUrl: string, image: ImageRef, sizePx: number): string {
  const px = Math.round(sizePx * dpr())
  const params = new URLSearchParams({ tag: image.tag, fillWidth: String(px), fillHeight: String(px), quality: '90' })
  return `${serverUrl}/Items/${encodeURIComponent(image.itemId)}/Images/Primary?${params}`
}

export function useImageUrl(image: ImageRef | null | undefined, sizePx: number): string | null {
  const serverUrl = useSessionStore((s) => s.session?.server.url)
  return image && serverUrl ? imageUrl(serverUrl, image, sizePx) : null
}
