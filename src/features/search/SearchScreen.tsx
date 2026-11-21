import { Search } from 'lucide-react'
import { EmptyState, Screen } from '../../core/ui/Screen'

export function SearchScreen() {
  return (
    <Screen title="Buscar">
      <label className="mt-2 flex h-11 items-center gap-2 rounded-xl bg-surface px-3 text-text-tertiary">
        <Search size={18} strokeWidth={2} aria-hidden />
        <input
          type="search"
          placeholder="Artistas, álbumes, canciones"
          className="flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-tertiary"
          disabled
        />
      </label>
      <EmptyState title="Búsqueda" description="Disponible cuando conectes tu servidor." />
    </Screen>
  )
}
