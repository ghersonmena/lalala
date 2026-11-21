import { useRegisterSW } from 'virtual:pwa-register/react'

/** Aviso cuando el service worker tiene una versión nueva de la app lista. */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div
      role="status"
      className="fixed inset-x-2.5 bottom-[calc(max(env(safe-area-inset-bottom),20px)+70px)] z-50 mx-auto flex max-w-[500px] items-center gap-3 rounded-2xl bg-surface-elevated px-4 py-3 shadow-2xl"
    >
      <p className="flex-1 text-sm">Hay una actualización disponible.</p>
      <button type="button" className="h-12 px-2 text-sm text-text-tertiary" onClick={() => setNeedRefresh(false)}>
        Luego
      </button>
      <button
        type="button"
        className="h-12 rounded-xl bg-surface px-4 text-sm font-semibold text-accent"
        onClick={() => void updateServiceWorker(true)}
      >
        Actualizar
      </button>
    </div>
  )
}
