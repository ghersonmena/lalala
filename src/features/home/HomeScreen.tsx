import { UserRound } from 'lucide-react'
import { Link } from 'react-router'
import { getRecentlyAddedAlbums, getRecentlyPlayedAlbums } from '../../core/data/libraryRepository'
import { useLibraryQuery, useMusicLibraries } from '../../core/data/libraryQueries'
import type { Album } from '../../core/model/library'
import { useSessionStore } from '../../core/session/sessionStore'
import { AlbumCarousel, Carousel, Section } from '../../core/ui/albums'
import { EmptyState, Screen } from '../../core/ui/Screen'
import { AlbumCardSkeleton, ErrorState, InlineEmpty } from '../../core/ui/states'
import type { UseQueryResult } from '@tanstack/react-query'

const CAROUSEL_SIZE = 20

export function HomeScreen() {
  const serverName = useSessionStore((s) => s.session?.server.name ?? 'tu servidor')
  const libraries = useMusicLibraries()
  const recentlyPlayed = useLibraryQuery('recently-played', (ctx) => getRecentlyPlayedAlbums(ctx, CAROUSEL_SIZE))
  const recentlyAdded = useLibraryQuery('recently-added-home', (ctx) =>
    getRecentlyAddedAlbums(ctx, { startIndex: 0, limit: CAROUSEL_SIZE }).then((p) => p.items),
  )

  return (
    <Screen
      title="Inicio"
      action={
        <Link
          to="/settings"
          viewTransition
          aria-label="Perfil y ajustes"
          className="flex size-12 items-center justify-center rounded-full bg-surface text-text-secondary"
        >
          <UserRound size={22} strokeWidth={2} aria-hidden />
        </Link>
      }
    >
      <p className="flex items-center gap-2 text-[0.8125rem] text-text-tertiary">
        <span className="size-2 rounded-full bg-accent" aria-hidden />
        Conectado a {serverName}
      </p>

      {libraries.isError ? (
        <ErrorState error={libraries.error} onRetry={() => void libraries.refetch()} />
      ) : libraries.data?.length === 0 ? (
        <EmptyState
          title="Sin bibliotecas de música"
          description="Tu usuario no tiene acceso a ninguna biblioteca de música en este servidor."
        />
      ) : (
        <>
          <AlbumSection
            title="Escuchado recientemente"
            seeAllTo="/recent/played"
            query={recentlyPlayed}
            emptyText="Cuando escuches música, tus álbumes aparecerán aquí."
          />
          <AlbumSection
            title="Agregado recientemente"
            seeAllTo="/recent/added"
            query={recentlyAdded}
            emptyText="Tu biblioteca aún no tiene álbumes."
          />
        </>
      )}
    </Screen>
  )
}

interface AlbumSectionProps {
  title: string
  seeAllTo: string
  query: UseQueryResult<Album[]>
  emptyText: string
}

function AlbumSection({ title, seeAllTo, query, emptyText }: AlbumSectionProps) {
  const hasItems = (query.data?.length ?? 0) > 0
  return (
    <Section title={title} seeAllTo={hasItems ? seeAllTo : undefined}>
      {query.isPending ? (
        <Carousel>
          {Array.from({ length: 4 }, (_, i) => (
            <AlbumCardSkeleton key={i} width={150} />
          ))}
        </Carousel>
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : hasItems ? (
        <AlbumCarousel albums={query.data} />
      ) : (
        <InlineEmpty>{emptyText}</InlineEmpty>
      )}
    </Section>
  )
}
