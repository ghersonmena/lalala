import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Clock, ListMusic, MicVocal, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { search } from '../../core/data/libraryRepository'
import { useLibraryContext } from '../../core/data/libraryQueries'
import { formatTotalDuration, songsLabel } from '../../core/format'
import type { Artist } from '../../core/model/library'
import { AlbumCarousel, Carousel, Section } from '../../core/ui/albums'
import { Cover } from '../../core/ui/Cover'
import { MediaRow, TrackRow } from '../../core/ui/rows'
import { EmptyState, Screen } from '../../core/ui/Screen'
import { ErrorState, RowSkeleton } from '../../core/ui/states'
import { playTracks, type PlaySource } from '../../playback'
import { openTrackActions } from '../player/TrackActions'
import { useSearchHistory } from './searchHistory'

const DEBOUNCE_MS = 300

function useDebounced(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), ms)
    return () => window.clearTimeout(t)
  }, [value, ms])
  return debounced
}

export function SearchScreen() {
  const [params, setParams] = useSearchParams()
  const [text, setText] = useState(params.get('q') ?? '')
  const term = useDebounced(text.trim(), DEBOUNCE_MS)
  const inputRef = useRef<HTMLInputElement>(null)
  const remember = useSearchHistory((s) => s.remember)

  // La búsqueda vive en la URL (?q=), así al volver de un álbum siguen los resultados.
  useEffect(() => {
    if ((params.get('q') ?? '') !== term) setParams(term ? { q: term } : {}, { replace: true, preventScrollReset: true })
  }, [term, params, setParams])

  const { ctx, ready, key } = useLibraryContext()
  const results = useQuery({
    queryKey: ['search', ...key, term],
    queryFn: () => search(ctx, term),
    enabled: ready && term.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })

  return (
    <Screen title="Buscar">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          remember(text)
          inputRef.current?.blur()
        }}
        className="sticky top-0 z-10 -mx-5 bg-background/95 px-5 pt-2 pb-3 backdrop-blur-md"
      >
        <label className="flex h-11 items-center gap-2 rounded-xl bg-surface px-3 text-text-tertiary focus-within:ring-2 focus-within:ring-accent">
          <Search size={18} strokeWidth={2} aria-hidden />
          <input
            ref={inputRef}
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="Buscar en tu biblioteca"
            placeholder="Artistas, álbumes, canciones"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-tertiary [&::-webkit-search-cancel-button]:hidden"
          />
          {text && (
            <button
              type="button"
              onClick={() => {
                setText('')
                inputRef.current?.focus()
              }}
              aria-label="Borrar búsqueda"
              className="-mr-2 flex size-10 items-center justify-center"
            >
              <X size={18} aria-hidden />
            </button>
          )}
        </label>
      </form>

      {!term ? (
        <RecentSearches onPick={(t) => setText(t)} />
      ) : results.isPending ? (
        <div className="mt-2">
          {Array.from({ length: 6 }, (_, i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      ) : results.isError ? (
        <ErrorState error={results.error} onRetry={() => void results.refetch()} />
      ) : (
        <Results data={results.data} term={term} onPick={() => remember(term)} loading={results.isFetching} />
      )}
    </Screen>
  )
}

function RecentSearches({ onPick }: { onPick: (term: string) => void }) {
  const { recent, clear } = useSearchHistory()
  if (recent.length === 0) {
    return <EmptyState title="Busca en tu biblioteca" description="Encuentra artistas, álbumes, canciones y playlists de tu servidor." />
  }
  return (
    <section className="mt-3">
      <header className="mb-1 flex items-baseline justify-between">
        <h2 className="section-title">Recientes</h2>
        <button type="button" onClick={clear} className="-my-3 py-3 text-[0.9375rem] text-accent">
          Borrar
        </button>
      </header>
      <ul>
        {recent.map((t) => (
          <li key={t} className="border-b border-divider">
            <button type="button" onClick={() => onPick(t)} className="flex min-h-12 w-full items-center gap-3 text-left active:opacity-60">
              <Clock size={18} className="text-text-tertiary" aria-hidden />
              <span className="truncate text-base">{t}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

interface ResultsProps {
  data: Awaited<ReturnType<typeof search>>
  term: string
  onPick: () => void
  loading: boolean
}

function Results({ data, term, onPick, loading }: ResultsProps) {
  const { artists, albums, tracks, playlists } = data
  const source: PlaySource = { type: 'songs', id: null, name: `Búsqueda: ${term}` }
  const empty = !artists.length && !albums.length && !tracks.length && !playlists.length

  if (empty) return <EmptyState title="Sin resultados" description={`No encontramos nada para “${term}”.`} />

  return (
    // Al seleccionar cualquier resultado se guarda la búsqueda en "Recientes".
    <div onClickCapture={onPick} className={`transition-opacity ${loading ? 'opacity-60' : ''}`}>
      {artists.length > 0 && (
        <Section title="Artistas">
          <ArtistCarousel artists={artists} />
        </Section>
      )}
      {albums.length > 0 && (
        <Section title="Álbumes">
          <AlbumCarousel albums={albums} />
        </Section>
      )}
      {tracks.length > 0 && (
        <Section title="Canciones">
          <ul>
            {tracks.map((t, i) => (
              <TrackRow key={t.id} track={t} onPlay={() => playTracks(tracks, i, source)} onMore={() => openTrackActions(t, source)} />
            ))}
          </ul>
        </Section>
      )}
      {playlists.length > 0 && (
        <Section title="Playlists">
          <ul>
            {playlists.map((p) => (
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
        </Section>
      )}
    </div>
  )
}

function ArtistCarousel({ artists }: { artists: Artist[] }) {
  return (
    <Carousel>
      {artists.map((a) => (
        <Link
          key={a.id}
          to={`/artist/${a.id}`}
          viewTransition
          className="flex w-24 shrink-0 snap-start flex-col items-center text-center active:opacity-70"
        >
          <Cover image={a.image} size={96} round fallbackIcon={MicVocal} className="w-24" />
          <span className="mt-2 line-clamp-2 text-[0.8125rem] font-medium">{a.name}</span>
        </Link>
      ))}
    </Carousel>
  )
}
