import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import { ChangelogModal } from '../changelog/ChangelogModal'
import { useSessionCheck } from '../core/session/useSessionCheck'
import { BottomNav } from '../core/ui/BottomNav'
import { UpdatePrompt } from '../core/ui/UpdatePrompt'

/** Layout raíz: contenido + barra inferior + modales globales. */
export function App() {
  useSessionCheck()
  const { pathname } = useLocation()
  const showNav = pathname !== '/settings'

  return (
    <div className="mx-auto min-h-dvh max-w-[520px] pb-[calc(max(env(safe-area-inset-bottom),20px)+80px)]">
      <Outlet />
      {showNav && <BottomNav />}
      <UpdatePrompt />
      <ChangelogModal />
      <ScrollRestoration />
    </div>
  )
}
