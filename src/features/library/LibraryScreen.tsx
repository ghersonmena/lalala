import { ChevronRight, Disc3, Download, ListMusic, MicVocal, Music, Tags, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { getRecentlyAddedAlbums } from '../../core/data/libraryRepository'
import { useLibraryQuery } from '../../core/data/libraryQueries'
import { AlbumGrid, Section } from '../../core/ui/albums'
import { Screen } from '../../core/ui/Screen'
import { AlbumCardSkeleton, ErrorState, InlineEmpty } from '../../core/ui/states'
import { LibraryPicker } from './LibraryPicker'

const ROWS: { label: string; icon: LucideIcon; to: string }[] = [
  { label: 'Playlists', icon: ListMusic, to: '/library/playlists' },
  { label: 'Artistas', icon: MicVocal, to: '/library/artists' },
  { label: 'Álbumes', icon: Disc3, to: '/library/albums' },
  { label: 'Canciones', icon: Music, to: '/library/songs' },
  { label: 'Géneros', icon: Tags, to: '/library/genres' },
  { label: 'Descargado', icon: Download, to: '/library/downloads' },
]

const GRID_SIZE = 10

export function LibraryScreen() {
  const recent = useLibraryQuery('recently-added-library', (ctx) =>
    getRecentlyAddedAlbums(ctx, { startIndex: 0, limit: GRID_SIZE }).then((p) => p.items),
  )

  return (
    <Screen title="Biblioteca">
      <LibraryPicker />
      <ul className="mt-1">
        {ROWS.map(({ label, icon: Icon, to }) => (
          <li key={label} className="border-b border-divider">
            <Link to={to} className="flex min-h-14 w-full items-center gap-4 active:opacity-70">
              <Icon size={24} strokeWidth={2} className="text-accent" aria-hidden />
              <span className="flex-1 text-[1.1875rem]">{label}</span>
              <ChevronRight size={20} strokeWidth={2} className="text-text-tertiary" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>

      <Section title="Agregado recientemente" seeAllTo={recent.data?.length ? '/recent/added' : undefined}>
        {recent.isPending ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            {Array.from({ length: 4 }, (_, i) => (
              <AlbumCardSkeleton key={i} />
            ))}
          </div>
        ) : recent.isError ? (
          <ErrorState error={recent.error} onRetry={() => void recent.refetch()} />
        ) : recent.data.length ? (
          <AlbumGrid albums={recent.data} />
        ) : (
          <InlineEmpty>Tu biblioteca aún no tiene álbumes.</InlineEmpty>
        )}
      </Section>
    </Screen>
  )
}
