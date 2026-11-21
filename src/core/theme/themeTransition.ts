import { THEME_BACKGROUND, type ResolvedTheme } from './themeStore'

/** Duración del círculo que crece al cambiar de tema (ms). */
export const THEME_TRANSITION_MS = 750

export function applyThemeToDocument(theme: ResolvedTheme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_BACKGROUND[theme])
}

/**
 * Cambia el tema con un círculo que nace en la esquina superior derecha y baja hasta cubrir
 * toda la pantalla, mostrando la app ya con el tema nuevo (luz al ir a claro, oscuridad al ir a oscuro).
 * Sin soporte de View Transitions o con reduced motion, cambia directo.
 */
export function transitionTheme(theme: ResolvedTheme, reducedMotion: boolean) {
  if (reducedMotion || typeof document.startViewTransition !== 'function') {
    applyThemeToDocument(theme)
    return
  }

  const vt = document.startViewTransition(() => applyThemeToDocument(theme))

  const x = window.innerWidth
  const y = 0
  // Radio hasta la esquina opuesta (inferior izquierda) para cubrir toda la pantalla.
  const radius = Math.hypot(window.innerWidth, window.innerHeight)

  vt.ready
    .then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: THEME_TRANSITION_MS, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' },
      )
    })
    .catch(() => {})
}
