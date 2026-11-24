import { lazy, Suspense, useEffect, useState } from 'react'
import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import { ChangelogModal } from '../changelog/ChangelogModal'
import { useSessionCheck } from '../core/session/useSessionCheck'
import { BottomNav } from '../core/ui/BottomNav'
import { UpdatePrompt } from '../core/ui/UpdatePrompt'
import { MiniPlayer } from '../features/player/MiniPlayer'
import { usePlayerSheet } from '../features/player/usePlayerSheet'
import { initPlayback, usePlayerStore } from '../playback'
import { useTabSwipe } from './tabSwipe'

// El reproductor completo (y las animaciones) se descarga la primera vez que se abre.
const FullPlayer = lazy(() => import('../features/player/FullPlayer').then((m) => ({ default: m.FullPlayer })))

/** Layout raíz: contenido + barra inferior + reproductor + modales globales. */
export function App() {
  useSessionCheck()
  useEffect(() => initPlayback(), [])
  const { pathname } = useLocation()
  const showNav = pathname !== '/settings'
  const hasQueue = usePlayerStore((s) => s.queue.length > 0)
  const { open: playerOpen } = usePlayerSheet()
  const [playerLoaded, setPlayerLoaded] = useState(false)
  if (playerOpen && !playerLoaded) setPlayerLoaded(true)
  useTabSwipe(!playerOpen)

  // Espacio inferior: barra de navegación (~84px) + mini-player (64px + 8px) si hay cola.
  const bottomSpace = `calc(max(env(safe-area-inset-bottom), 20px) + ${showNav ? 80 : 0}px + ${hasQueue ? 76 : 0}px)`

  return (
    <div className="mx-auto min-h-dvh max-w-[520px]" style={{ paddingBottom: bottomSpace }}>
      {/* Con el reproductor abierto, el fondo no recibe foco ni toques (inert). */}
      <div inert={playerOpen}>
        <Outlet />
        <MiniPlayer />
        {showNav && <BottomNav />}
      </div>
      {playerLoaded && (
        <Suspense fallback={null}>
          <FullPlayer />
        </Suspense>
      )}
      <UpdatePrompt />
      <ChangelogModal />
      <ScrollRestoration />
    </div>
  )
}
