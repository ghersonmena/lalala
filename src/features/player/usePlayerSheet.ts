import { useLocation, useNavigate } from 'react-router'

/**
 * El reproductor completo se abre como una entrada en el historial (state.player), así el botón
 * "atrás" de Android o del navegador lo cierra en lugar de salir de la pantalla.
 */
export function usePlayerSheet() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = (location.state ?? {}) as Record<string, unknown>
  const open = state.player === true

  return {
    open,
    openPlayer: () => {
      if (!open) {
        void navigate(location.pathname + location.search, {
          state: { ...state, player: true },
          preventScrollReset: true,
        })
      }
    },
    closePlayer: () => {
      if (open) void navigate(-1)
    },
    /** Cierra el reproductor y navega (reemplaza la entrada del reproductor). */
    closeAndGo: (to: string) => void navigate(to, { replace: open }),
  }
}
