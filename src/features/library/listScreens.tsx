import { Download, ListMusic, MicVocal } from 'lucide-react'
import { useParams } from 'react-router'
import {
  getAlbums,
  getArtists,
  getGenre,
  getGenreAlbums,
  getGenres,
  getPlaylists,
  getRecentlyAddedAlbums,
  getRecentlyPlayedAlbums,
  getTracks,
} from '../../core/data/libraryRepository'
import { useLibraryInfiniteQuery, useLibraryQuery } from '../../core/data/libraryQueries'
import { formatTotalDuration, songsLabel } from '../../core/format'
import { AlbumGrid } from '../../core/ui/albums'
import { PagedList } from '../../core/ui/paged'
import { MediaRow, SubScreen, TrackRow } from '../../core/ui/rows'
import { EmptyState } from '../../core/ui/Screen'
import { AlbumCardSkeleton, ErrorState, RowSkeleton } from '../../core/ui/states'

const gridSkeleton = (
  <div className="grid grid-cols-2 gap-x-4 gap-y-5">
    {Array.from({ length: 6 }, (_, i) => (
      <AlbumCardSkeleton key={i} />
    ))}
  </div>
)

const rowsSkeleton = (withCover = true) => (
  <div>
    {Array.from({ length: 8 }, (_, i) => (
      <RowSkeleton key={i} withCover={withCover} />
    ))}
  </div>
)

export function AlbumsScreen() {
  const query = useLibraryInfiniteQuery('albums', getAlbums)
  return (
    <SubScreen title="Álbumes" back="Biblioteca">
      <PagedList query={query} skeleton={gridSkeleton} empty={{ title: 'Sin álbumes' }}>
        {(albums) => <AlbumGrid albums={albums} />}
      </PagedList>
    </SubScreen>
  )
}

export function RecentlyAddedScreen() {
  const query = useLibraryInfiniteQuery('recently-added', getRecentlyAddedAlbums)
  return (
    <SubScreen title="Agregado recientemente">
      <PagedList query={query} skeleton={gridSkeleton} empty={{ title: 'Sin álbumes' }}>
        {(albums) => <AlbumGrid albums={albums} />}
      </PagedList>
    </SubScreen>
  )
}

export function RecentlyPlayedScreen() {
  const query = useLibraryQuery('recently-played-all', (ctx) => getRecentlyPlayedAlbums(ctx, 60))
  return (
    <SubScreen title="Escuchado recientemente">
      {query.isPending ? (
        gridSkeleton
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : query.data.length ? (
        <AlbumGrid albums={query.data} />
      ) : (
        <EmptyState title="Nada por aquí" description="Cuando escuches música, tus álbumes aparecerán aquí." />
      )}
    </SubScreen>
  )
}

export function ArtistsScreen() {
  const query = useLibraryInfiniteQuery('artists', getArtists)
  return (
    <SubScreen title="Artistas" back="Biblioteca">
      <PagedList query={query} skeleton={rowsSkeleton()} empty={{ title: 'Sin artistas' }}>
        {(artists) => (
          <ul>
            {artists.map((a) => (
              <MediaRow key={a.id} to={`/artist/${a.id}`} title={a.name} image={a.image} icon={MicVocal} round />
            ))}
          </ul>
        )}
      </PagedList>
    </SubScreen>
  )
}

export function SongsScreen() {
  const query = useLibraryInfiniteQuery('tracks', getTracks)
  const total = query.data?.pages[0]?.total
  return (
    <SubScreen title="Canciones" back="Biblioteca">
      {total ? <p className="-mt-2 mb-2 text-[0.8125rem] text-text-tertiary">{songsLabel(total)}</p> : null}
      <PagedList query={query} skeleton={rowsSkeleton()} empty={{ title: 'Sin canciones' }}>
        {(tracks) => (
          <ul>
            {tracks.map((t) => (
              <TrackRow key={t.id} track={t} />
            ))}
          </ul>
        )}
      </PagedList>
    </SubScreen>
  )
}

export function PlaylistsScreen() {
  const query = useLibraryQuery('playlists', getPlaylists)
  return (
    <SubScreen title="Playlists" back="Biblioteca">
      {query.isPending ? (
        rowsSkeleton()
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : query.data.length ? (
        <ul>
          {query.data.map((p) => (
            <MediaRow
              key={p.id}
              to={`/playlist/${p.id}`}
              title={p.name}
              subtitle={[p.trackCount != null && songsLabel(p.trackCount), p.durationMs > 0 && formatTotalDuration(p.durationMs)]
                .filter(Boolean)
                .join(' · ')}
              image={p.image}
              icon={ListMusic}
            />
          ))}
        </ul>
      ) : (
        <EmptyState title="Sin playlists" description="Las playlists que crees en Jellyfin aparecerán aquí." />
      )}
    </SubScreen>
  )
}

export function GenresScreen() {
  const query = useLibraryInfiniteQuery('genres', getGenres)
  return (
    <SubScreen title="Géneros" back="Biblioteca">
      <PagedList query={query} skeleton={rowsSkeleton(false)} empty={{ title: 'Sin géneros' }}>
        {(genres) => (
          <ul>
            {genres.map((g) => (
              <MediaRow key={g.id} to={`/genre/${g.id}`} title={g.name} />
            ))}
          </ul>
        )}
      </PagedList>
    </SubScreen>
  )
}

export function GenreScreen() {
  const { id = '' } = useParams()
  const genre = useLibraryQuery('genre', (ctx) => getGenre(ctx, id), id)
  const query = useLibraryInfiniteQuery('genre-albums', (ctx, page) => getGenreAlbums(ctx, id, page), id)
  return (
    <SubScreen title={genre.data?.name ?? ' '} back="Géneros">
      <PagedList query={query} skeleton={gridSkeleton} empty={{ title: 'Sin álbumes en este género' }}>
        {(albums) => <AlbumGrid albums={albums} />}
      </PagedList>
    </SubScreen>
  )
}

export function DownloadsScreen() {
  return (
    <SubScreen title="Descargado" back="Biblioteca">
      <div className="mt-16 flex flex-col items-center text-center">
        <Download size={36} strokeWidth={1.5} className="text-text-tertiary" aria-hidden />
        <p className="mt-3 font-display text-lg font-extrabold">Aún no hay descargas</p>
        <p className="mt-1 max-w-72 text-[0.8125rem] text-text-secondary">
          Podrás descargar música para escucharla sin conexión en una próxima versión.
        </p>
      </div>
    </SubScreen>
  )
}
