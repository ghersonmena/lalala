import { UserRound } from 'lucide-react'
import { Link } from 'react-router'
import { useSessionStore } from '../../core/session/sessionStore'
import { EmptyState, Screen } from '../../core/ui/Screen'

export function HomeScreen() {
  const serverName = useSessionStore((s) => s.session?.server.name ?? 'tu servidor')
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
        <span className="size-2 rounded-full bg-accent" aria-hidden />
        Conectado a {serverName}
      </p>
      <EmptyState title="Tu música llegará pronto" description="Los álbumes y canciones de tu servidor aparecerán aquí." />
    </Screen>
  )
}
