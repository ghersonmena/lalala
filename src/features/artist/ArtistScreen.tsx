import { MicVocal } from 'lucide-react'
import { useParams } from 'react-router'
import { getArtist, getArtistAlbums } from '../../core/data/libraryRepository'
import { useLibraryQuery } from '../../core/data/libraryQueries'
import { AlbumGrid, Section } from '../../core/ui/albums'
import { Cover } from '../../core/ui/Cover'
import { BackButton } from '../../core/ui/rows'
import { AlbumCardSkeleton, ErrorState, InlineEmpty } from '../../core/ui/states'

export function ArtistScreen() {
  const { id = '' } = useParams()
  const artist = useLibraryQuery('artist', (ctx) => getArtist(ctx, id), id)
  const albums = useLibraryQuery('artist-albums', (ctx) => getArtistAlbums(ctx, id), id)

  return (
    <main className="px-5 pt-[max(env(safe-area-inset-top),8px)]">
      <BackButton />
      {artist.isError ? (
        <ErrorState error={artist.error} onRetry={() => void artist.refetch()} />
      ) : (
        <>
          <header className="flex flex-col items-center pt-2 text-center">
            <Cover
              image={artist.data?.image ?? null}
              size={180}
              round
              fallbackIcon={MicVocal}
              alt={artist.data?.name ?? ''}
              className="w-[180px] cover-shadow"
            />
            {artist.data ? (
              <h1 className="screen-title mt-5">{artist.data.name}</h1>
            ) : (
              <div className="mt-5 h-8 w-1/2 animate-pulse rounded bg-surface" aria-hidden />
            )}
          </header>

          <Section title="Álbumes">
            {albums.isPending ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                {Array.from({ length: 4 }, (_, i) => (
                  <AlbumCardSkeleton key={i} />
                ))}
              </div>
            ) : albums.isError ? (
              <ErrorState error={albums.error} onRetry={() => void albums.refetch()} />
            ) : albums.data.length ? (
              <AlbumGrid albums={albums.data} />
            ) : (
              <InlineEmpty>Este artista no tiene álbumes propios en tu biblioteca.</InlineEmpty>
            )}
          </Section>
        </>
      )}
    </main>
  )
}
