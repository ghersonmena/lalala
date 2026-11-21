import { ListMusic } from 'lucide-react'
import { useParams } from 'react-router'
import { getPlaylist, getPlaylistTracks } from '../../core/data/libraryRepository'
import { useLibraryInfiniteQuery, useLibraryQuery } from '../../core/data/libraryQueries'
import { formatTotalDuration, songsLabel } from '../../core/format'
import { Cover } from '../../core/ui/Cover'
import { PagedList } from '../../core/ui/paged'
import { BackButton, TrackRow } from '../../core/ui/rows'
import { ErrorState, RowSkeleton } from '../../core/ui/states'

export function PlaylistScreen() {
  const { id = '' } = useParams()
  const playlist = useLibraryQuery('playlist', (ctx) => getPlaylist(ctx, id), id)
  const tracks = useLibraryInfiniteQuery('playlist-tracks', (ctx, page) => getPlaylistTracks(ctx, id, page), id)
  const p = playlist.data
  const meta = p
    ? [p.trackCount != null && songsLabel(p.trackCount), p.durationMs > 0 && formatTotalDuration(p.durationMs)]
        .filter(Boolean)
        .join(' · ')
    : ''

  return (
    <main className="px-5 pt-[max(env(safe-area-inset-top),8px)]">
      <BackButton />
      {playlist.isError ? (
        <ErrorState error={playlist.error} onRetry={() => void playlist.refetch()} />
      ) : (
        <>
          <header className="flex flex-col items-center pt-2 pb-4 text-center">
            <Cover
              image={p?.image ?? null}
              size={220}
              fallbackIcon={ListMusic}
              className="w-[220px] rounded-xl cover-shadow"
            />
            {p ? (
              <>
                <h1 className="mt-5 font-display text-[1.4375rem] leading-tight font-extrabold">{p.name}</h1>
                {meta && <p className="label-caps mt-1.5 text-text-tertiary">{meta}</p>}
              </>
            ) : (
              <div className="mt-5 h-6 w-1/2 animate-pulse rounded bg-surface" aria-hidden />
            )}
          </header>
          <PagedList
            query={tracks}
            skeleton={Array.from({ length: 6 }, (_, i) => <RowSkeleton key={i} />)}
            empty={{ title: 'Playlist vacía' }}
          >
            {(items) => (
              <ul>
                {items.map((t, i) => (
                  <TrackRow key={`${t.id}-${i}`} track={t} />
                ))}
              </ul>
            )}
          </PagedList>
        </>
      )}
    </main>
  )
}
