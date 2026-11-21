import { useMusicLibraries } from '../../core/data/libraryQueries'
import { useLibraryStore } from '../../core/session/libraryStore'

/**
 * Chips para elegir biblioteca de música. Solo aparece si el usuario tiene más de una.
 * La elección filtra Inicio, Biblioteca y las listas, y se recuerda.
 */
export function LibraryPicker() {
  const { data: libraries } = useMusicLibraries()
  const selected = useLibraryStore((s) => s.selectedLibraryId)
  const selectLibrary = useLibraryStore((s) => s.selectLibrary)

  if (!libraries || libraries.length < 2) return null
  const current = libraries.some((l) => l.id === selected) ? selected : null
  const options = [{ id: null, name: 'Todas' }, ...libraries]

  return (
    <div
      role="radiogroup"
      aria-label="Biblioteca"
      className="no-scrollbar -mx-5 mt-1 mb-2 flex gap-2 overflow-x-auto px-5"
    >
      {options.map((lib) => {
        const active = lib.id === current
        return (
          <button
            key={lib.id ?? 'all'}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => selectLibrary(lib.id)}
            className={`h-9 shrink-0 rounded-full px-4 text-sm font-medium transition-colors ${
              active ? 'bg-accent text-white' : 'bg-surface text-text-secondary'
            }`}
          >
            {lib.name}
          </button>
        )
      })}
    </div>
  )
}
