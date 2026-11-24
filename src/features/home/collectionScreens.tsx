import { Heart, Sparkles, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { getFavoriteTracks, getWeeklyMix } from '../../core/data/libraryRepository'
import { useQuery } from '@tanstack/react-query'
import { useLibraryContext, useLibraryInfiniteQuery } from '../../core/data/libraryQueries'
import { formatTotalDuration, songsLabel } from '../../core/format'
import type { Track } from '../../core/model/library'
import { PagedList } from '../../core/ui/paged'
import { BackButton, TrackRow } from '../../core/ui/rows'
import { EmptyState } from '../../core/ui/Screen'
import { ErrorState, RowSkeleton } from '../../core/ui/states'
import { playTracks, type PlaySource } from '../../playback'
import { PlayButtons } from '../player/PlayButtons'
import { openTrackActions } from '../player/TrackActions'

const skeleton = Array.from({ length: 8 }, (_, i) => <RowSkeleton key={i} />)

interface HeaderProps {
  title: string
  subtitle?: string
  icon: LucideIcon
  gradient: string
  tracks: Track[] | undefined
  source: PlaySource
}

function CollectionHeader({ title, subtitle, icon: Icon, gradient, tracks, source }: HeaderProps) {
  return (
    <header className="flex flex-col items-center pt-2 pb-4 text-center">
      <div className="cover-shadow flex size-[200px] items-center justify-center rounded-xl text-white" style={{ background: gradient }}>
        <Icon size={72} strokeWidth={1.5} aria-hidden />
      </div>
      <h1 className="mt-5 font-display text-[1.4375rem] leading-tight font-extrabold">{title}</h1>
      {subtitle && <p className="label-caps mt-1.5 text-text-tertiary">{subtitle}</p>}
      <PlayButtons tracks={tracks} source={source} />
    </header>
  )
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="px-5 pt-[max(env(safe-area-inset-top),8px)]">
      <BackButton />
      {children}
    </main>
  )
}

const MIX_SOURCE: PlaySource = { type: 'mix', id: null, name: 'Mix de la semana' }
const FAVORITES_SOURCE: PlaySource = { type: 'favorites', id: null, name: 'Favoritas' }

/** "Mix de la semana": Instant Mix de Jellyfin basado en lo que más escuchas. */
export function MixScreen() {
  // Se calcula una vez por sesión: no cambia cada vez que abres la pantalla.
  const { ctx, ready, key } = useLibraryContext()
  const mix = useQuery({ queryKey: ['weekly-mix', ...key], queryFn: () => getWeeklyMix(ctx), enabled: ready, staleTime: Infinity })
  const tracks = mix.data?.tracks
  const total = tracks?.reduce((sum, t) => sum + t.durationMs, 0) ?? 0

  return (
    <Shell>
      <CollectionHeader
        title="Mix de la semana"
        subtitle={mix.data?.basedOn ? `Inspirado en ${mix.data.basedOn}` : undefined}
        icon={Sparkles}
        gradient="linear-gradient(160deg, #FF8A4C 0%, #E2366B 55%, #6A2FB8 100%)"
        tracks={tracks}
        source={MIX_SOURCE}
      />
      {mix.isPending ? (
        skeleton
      ) : mix.isError ? (
        <ErrorState error={mix.error} onRetry={() => void mix.refetch()} />
      ) : tracks?.length ? (
        <>
          <ul>
            {tracks.map((t, i) => (
              <TrackRow
                key={`${t.id}-${i}`}
                track={t}
                onPlay={() => playTracks(tracks, i, MIX_SOURCE)}
                onMore={() => openTrackActions(t, MIX_SOURCE)}
              />
            ))}
          </ul>
          <p className="mt-4 text-[0.8125rem] text-text-tertiary">
            {songsLabel(tracks.length)} · {formatTotalDuration(total)}
          </p>
        </>
      ) : (
        <EmptyState title="Aún no hay mix" description="Escucha algo de música y tu mix aparecerá aquí." />
      )}
    </Shell>
  )
}

/** Canciones marcadas como favoritas en Jellyfin. */
export function FavoritesScreen() {
  const query = useLibraryInfiniteQuery('favorites', getFavoriteTracks)
  const loaded = query.data?.pages.flatMap((p) => p.items)
  const total = query.data?.pages[0]?.total

  return (
    <Shell>
      <CollectionHeader
        title="Favoritas"
        subtitle={total ? songsLabel(total) : undefined}
        icon={Heart}
        gradient="linear-gradient(160deg, #FF5E8A 0%, #C2185B 50%, #3B1340 100%)"
        tracks={loaded}
        source={FAVORITES_SOURCE}
      />
      <PagedList
        query={query}
        skeleton={skeleton}
        empty={{ title: 'Sin favoritas', description: 'Toca el ♥ en el reproductor o en el menú ⋯ de una canción.' }}
      >
        {(items) => (
          <ul>
            {items.map((t, i) => (
              <TrackRow
                key={t.id}
                track={t}
                onPlay={() => playTracks(items, i, FAVORITES_SOURCE)}
                onMore={() => openTrackActions(t, FAVORITES_SOURCE)}
              />
            ))}
          </ul>
        )}
      </PagedList>
    </Shell>
  )
}
