import type { createBrowserRouter } from 'react-router'

type Router = ReturnType<typeof createBrowserRouter>
export type NavDirection = 'push' | 'pop' | 'tab' | 'tab-next' | 'tab-prev'

/** Raíces de las pestañas: entre ellas (o al tocar una pestaña) se hace un fundido, no un deslizamiento. */
const TAB_ROOTS = new Set(['/', '/library', '/search'])

export function navDirection(
  action: 'PUSH' | 'POP' | 'REPLACE',
  from: string,
  to: string,
  swipe?: 'next' | 'prev',
): NavDirection {
  // Deslizar entre pestañas: la pantalla se mueve en la dirección del dedo.
  if (action !== 'POP' && swipe) return swipe === 'next' ? 'tab-next' : 'tab-prev'
  if (action === 'POP') return TAB_ROOTS.has(from) && TAB_ROOTS.has(to) ? 'tab' : 'pop'
  return TAB_ROOTS.has(to) ? 'tab' : 'push'
}

/**
 * Marca en <html data-nav="push|pop|tab"> el tipo de navegación para que el CSS de la
 * View Transition elija la animación (estilo iOS: entrar desliza desde la derecha, atrás al revés).
 * El suscriptor corre antes de que el navegador arme la animación.
 */
export function setupNavTransitions(router: Router) {
  let prev = router.state.location.pathname
  router.subscribe((state) => {
    const path = state.location.pathname
    if (path === prev || state.navigation.state !== 'idle') return
    const swipe = (state.location.state as { swipe?: 'next' | 'prev' } | null)?.swipe
    document.documentElement.dataset.nav = navDirection(state.historyAction, prev, path, swipe)
    prev = path
  })
}
