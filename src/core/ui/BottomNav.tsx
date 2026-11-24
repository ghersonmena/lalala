import { House, Library, Search, type LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router'

const TABS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: 'Inicio', icon: House },
  { to: '/library', label: 'Biblioteca', icon: Library },
  { to: '/search', label: 'Buscar', icon: Search },
]

export function BottomNav() {
  return (
    <nav
      aria-label="Navegación principal"
      className="vt-nav fixed inset-x-0 bottom-0 z-40 border-t border-nav-border bg-nav-bar/95 backdrop-blur-md"
    >
      <ul className="mx-auto flex max-w-[520px] pt-1.5 pb-[max(env(safe-area-inset-bottom),20px)]">
        {TABS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              viewTransition
              end={to === '/'}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium transition-colors ${
                  isActive ? 'text-accent' : 'text-text-tertiary'
                }`
              }
            >
              <Icon size={24} strokeWidth={2} aria-hidden />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
