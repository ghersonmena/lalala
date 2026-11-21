import { UserRound } from 'lucide-react'
import { Link } from 'react-router'
import { EmptyState, Screen } from '../../core/ui/Screen'

export function HomeScreen() {
  return (
    <Screen
      title="Inicio"
      action={
        <Link
          to="/settings"
          aria-label="Perfil y ajustes"
          className="flex size-12 items-center justify-center rounded-full bg-surface text-text-secondary"
        >
          <UserRound size={22} strokeWidth={2} aria-hidden />
        </Link>
      }
    >
      <p className="flex items-center gap-2 text-[0.8125rem] text-text-tertiary">
        <span className="size-2 rounded-full bg-text-tertiary" aria-hidden />
        Sin servidor conectado
      </p>
      <EmptyState title="Aún no hay música" description="Conecta tu servidor Jellyfin para ver tu biblioteca aquí." />
    </Screen>
  )
}
