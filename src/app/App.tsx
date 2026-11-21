import { Outlet, useLocation } from 'react-router'
import { ChangelogModal } from '../changelog/ChangelogModal'
import { BottomNav } from '../core/ui/BottomNav'
import { UpdatePrompt } from '../core/ui/UpdatePrompt'

const TAB_PATHS = ['/', '/library', '/search']

/** Layout raíz: contenido + barra inferior + modales globales. */
export function App() {
  const { pathname } = useLocation()
  const showNav = TAB_PATHS.includes(pathname)

  return (
    <div className="mx-auto min-h-dvh max-w-[520px] pb-[calc(max(env(safe-area-inset-bottom),20px)+80px)]">
      <Outlet />
      {showNav && <BottomNav />}
      <UpdatePrompt />
      <ChangelogModal />
    </div>
  )
}
