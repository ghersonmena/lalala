import { ChevronRight, Disc3, Download, ListMusic, MicVocal, Music, Tags, type LucideIcon } from 'lucide-react'
import { Screen } from '../../core/ui/Screen'

const ROWS: { label: string; icon: LucideIcon }[] = [
  { label: 'Playlists', icon: ListMusic },
  { label: 'Artistas', icon: MicVocal },
  { label: 'Álbumes', icon: Disc3 },
  { label: 'Canciones', icon: Music },
  { label: 'Géneros', icon: Tags },
  { label: 'Descargado', icon: Download },
]

export function LibraryScreen() {
  return (
    <Screen
      title="Biblioteca"
      action={
        <button type="button" className="h-12 px-1 text-[1.0625rem] text-accent">
          Editar
        </button>
      }
    >
      {/* Las filas se conectan a sus listas en la Fase 2 */}
      <ul className="mt-2">
        {ROWS.map(({ label, icon: Icon }) => (
          <li key={label} className="border-b border-divider">
            <button type="button" className="flex min-h-14 w-full items-center gap-4 text-left">
              <Icon size={24} strokeWidth={2} className="text-accent" aria-hidden />
              <span className="flex-1 text-[1.1875rem]">{label}</span>
              <ChevronRight size={20} strokeWidth={2} className="text-text-tertiary" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </Screen>
  )
}
