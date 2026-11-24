import { useEffect, useEffectEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'

/** Orden de las pestañas para el gesto de deslizar. */
export const TAB_ORDER = ['/', '/library', '/search'] as const

const MIN_DISTANCE = 70 // px horizontales
const MAX_DURATION = 700 // ms
const EDGE_GUARD = 24 // px desde el borde: ahí manda el gesto "atrás" del sistema

/**
 * Pestaña destino para un deslizamiento, o null si no aplica.
 * Izquierda (dx < 0) = siguiente pestaña; derecha = anterior. No da la vuelta.
 */
export function swipeTarget(pathname: string, dx: number, dy: number, durationMs: number): string | null {
  const index = TAB_ORDER.indexOf(pathname as (typeof TAB_ORDER)[number])
  if (index === -1) return null
  if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * 2 || durationMs > MAX_DURATION) return null
  return TAB_ORDER[index + (dx < 0 ? 1 : -1)] ?? null
}

/** ¿El toque empezó en algo que ya usa el gesto horizontal (carrusel, chips, deslizador, campo)? */
function startsInHorizontalScroller(target: EventTarget | null): boolean {
  let el = target instanceof Element ? target : null
  if (el?.closest('input, textarea, select, [role="slider"], [data-no-swipe]')) return true
  while (el && el !== document.body) {
    const overflowX = getComputedStyle(el).overflowX
    if ((overflowX === 'auto' || overflowX === 'scroll') && el.scrollWidth > el.clientWidth) return true
    el = el.parentElement
  }
  return false
}

/** Cambia de pestaña (Inicio ↔ Biblioteca ↔ Buscar) al deslizar horizontalmente en una de ellas. */
export function useTabSwipe(enabled: boolean) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const onSwipe = useEffectEvent((dx: number, dy: number, duration: number) => {
    // Sin gesto si hay un diálogo abierto (Novedades, etc.).
    if (document.querySelector('dialog[open]')) return
    const to = swipeTarget(pathname, dx, dy, duration)
    if (to) void navigate(to, { viewTransition: true, state: { swipe: dx < 0 ? 'next' : 'prev' } })
  })

  useEffect(() => {
    if (!enabled) return
    let start: { x: number; y: number; t: number } | null = null

    const onStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (e.touches.length !== 1 || !touch) return (start = null)
      const nearEdge = touch.clientX < EDGE_GUARD || touch.clientX > window.innerWidth - EDGE_GUARD
      start = nearEdge || startsInHorizontalScroller(e.target) ? null : { x: touch.clientX, y: touch.clientY, t: e.timeStamp }
    }
    const onEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0]
      if (!start || !touch) return
      onSwipe(touch.clientX - start.x, touch.clientY - start.y, e.timeStamp - start.t)
      start = null
    }
    const onCancel = () => (start = null)

    document.addEventListener('touchstart', onStart, { passive: true })
    document.addEventListener('touchend', onEnd, { passive: true })
    document.addEventListener('touchcancel', onCancel, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onStart)
      document.removeEventListener('touchend', onEnd)
      document.removeEventListener('touchcancel', onCancel)
    }
  }, [enabled])
}
