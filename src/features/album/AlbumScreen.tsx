import { Link, useParams } from 'react-router'
import { getAlbum, getAlbumTracks } from '../../core/data/libraryRepository'
import { useLibraryQuery } from '../../core/data/libraryQueries'
import { formatDuration, formatTotalDuration, songsLabel } from '../../core/format'
import type { Album, Track } from '../../core/model/library'
import { Cover } from '../../core/ui/Cover'
import { BackButton } from '../../core/ui/rows'
import { Equalizer } from '../../core/ui/Equalizer'
import { ErrorState, RowSkeleton } from '../../core/ui/states'
import { playTracks, useNowPlaying, type PlaySource } from '../../playback'
import { PlayButtons } from '../player/PlayButtons'

export function AlbumScreen() {
  const { id = '' } = useParams()
  const album = useLibraryQuery('album', (ctx) => getAlbum(ctx, id), id)
  const tracks = useLibraryQuery('album-tracks', (ctx) => getAlbumTracks(ctx, id), id)

  return (
    <main className="px-5 pt-[max(env(safe-area-inset-top),8px)]">
      <BackButton />
      {album.isError ? (
        <ErrorState error={album.error} onRetry={() => void album.refetch()} />
      ) : (
        <>
          <AlbumHeader album={album.data} tracks={tracks.data} />
          {tracks.isPending ? (
            <div className="mt-4">
              {Array.from({ length: 6 }, (_, i) => (
                <RowSkeleton key={i} withCover={false} />
              ))}
            </div>
          ) : tracks.isError ? (
            <ErrorState error={tracks.error} onRetry={() => void tracks.refetch()} />
          ) : (
            <TrackList
              tracks={tracks.data}
              albumArtist={album.data?.artistName}
              source={album.data ? { type: 'album', id: album.data.id, name: album.data.name } : null}
            />
          )}
        </>
      )}
    </main>
  )
}

/** Formato más común entre las canciones del álbum (FLAC, MP3…). */
function albumFormat(tracks: Track[] | undefined): string | null {
  const counts = new Map<string, number>()
  for (const t of tracks ?? []) if (t.container) counts.set(t.container, (counts.get(t.container) ?? 0) + 1)
  let best: string | null = null
  for (const [k, v] of counts) if (!best || v > (counts.get(best) ?? 0)) best = k
  return best?.toUpperCase() ?? null
}

function AlbumHeader({ album, tracks }: { album?: Album; tracks?: Track[] }) {
  const artist = album?.artists[0]
  const meta = [album?.genres[0], album?.year, albumFormat(tracks)].filter(Boolean).join(' · ')

  return (
    <header className="flex flex-col items-center pt-2 text-center">
      <Cover
        image={album?.image ?? null}
        size={250}
        alt={album ? `Portada de ${album.name}` : ''}
        className="w-[250px] max-w-full rounded-xl cover-shadow"
      />
      {album ? (
        <>
          <h1 className="mt-5 font-display text-[1.4375rem] leading-tight font-extrabold">{album.name}</h1>
          {artist ? (
            <Link to={`/artist/${artist.id}`} viewTransition className="mt-1 text-[1.0625rem] text-accent">
              {album.artistName}
            </Link>
          ) : (
            <p className="mt-1 text-[1.0625rem] text-accent">{album.artistName}</p>
          )}
          {meta && <p className="label-caps mt-1.5 text-text-tertiary">{meta}</p>}
        </>
      ) : (
        <div className="mt-5 flex w-full flex-col items-center gap-2" aria-hidden>
          <div className="h-6 w-3/5 animate-pulse rounded bg-surface" />
          <div className="h-4 w-2/5 animate-pulse rounded bg-surface" />
        </div>
      )}

      <PlayButtons tracks={tracks} source={album ? { type: 'album', id: album.id, name: album.name } : null} />
    </header>
  )
}

interface TrackListProps {
  tracks: Track[]
  albumArtist?: string
  source: PlaySource | null
}

function TrackList({ tracks, albumArtist, source }: TrackListProps) {
  if (tracks.length === 0) {
    return <p className="mt-8 text-center text-[0.8125rem] text-text-secondary">Este álbum no tiene canciones.</p>
  }

  const discs = new Set(tracks.map((t) => t.discNumber ?? 1))
  const multiDisc = discs.size > 1
  const totalMs = tracks.reduce((sum, t) => sum + t.durationMs, 0)

  return (
    <>
      <ol className="mt-5">
        {tracks.map((t, i) => {
          const disc = t.discNumber ?? 1
          const newDisc = multiDisc && (i === 0 || (tracks[i - 1]?.discNumber ?? 1) !== disc)
          return (
            <li key={t.id}>
              {newDisc && <p className="label-caps pt-4 pb-1 text-text-tertiary">Disco {disc}</p>}
              <AlbumTrackRow
                track={t}
                number={t.trackNumber ?? i + 1}
                showArtist={t.artistName !== albumArtist}
                onPlay={() => source && playTracks(tracks, i, source)}
              />
            </li>
          )
        })}
      </ol>
      <p className="mt-4 text-[0.8125rem] text-text-tertiary">
        {songsLabel(tracks.length)} · {formatTotalDuration(totalMs)}
      </p>
    </>
  )
}

interface AlbumTrackRowProps {
  track: Track
  number: number
  showArtist: boolean
  onPlay: () => void
}

/** Fila numerada; la que suena muestra el ecualizador en lugar del número y el título en acento. */
function AlbumTrackRow({ track, number, showArtist, onPlay }: AlbumTrackRowProps) {
  const { active, playing } = useNowPlaying(track.id)
  return (
    <button
      type="button"
      onClick={onPlay}
      aria-current={active ? 'true' : undefined}
      className="flex min-h-14 w-full items-center gap-4 border-b border-divider text-left active:opacity-60"
    >
      <span className="flex w-6 shrink-0 justify-end text-[0.9375rem] text-text-tertiary tabular-nums">
        {active ? <Equalizer playing={playing} /> : number}
      </span>
      <span className="min-w-0 flex-1 py-2.5">
        <span className={`block truncate text-base ${active ? 'text-accent' : ''}`}>{track.name}</span>
        {showArtist && <span className="block truncate text-[0.8125rem] text-text-secondary">{track.artistName}</span>}
      </span>
      <span className="shrink-0 text-[0.8125rem] text-text-tertiary tabular-nums">{formatDuration(track.durationMs)}</span>
    </button>
  )
}
