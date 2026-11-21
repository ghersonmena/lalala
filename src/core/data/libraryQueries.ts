import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useApi } from '../api/sessionApi'
import type { Page } from '../model/library'
import { useLibraryStore } from '../session/libraryStore'
import { useSessionStore } from '../session/sessionStore'
import { getMusicLibraries, type LibraryContext, type PageRequest } from './libraryRepository'

export const PAGE_SIZE = 100

/** Bibliotecas de música del usuario. */
export function useMusicLibraries() {
  const api = useApi()
  const userId = useSessionStore((s) => s.session?.userId ?? '')
  return useQuery({
    queryKey: ['music-libraries', userId],
    queryFn: () => getMusicLibraries({ api, userId }),
    staleTime: 30 * 60 * 1000,
  })
}

/**
 * Contexto para consultar la biblioteca. `ready` es false hasta conocer las bibliotecas
 * (así no se consulta "todas" y luego otra vez la elegida).
 * Si la biblioteca guardada ya no existe (otro servidor/usuario), se usan todas.
 */
export function useLibraryContext(): { ctx: LibraryContext; ready: boolean; key: readonly [string, string] } {
  const api = useApi()
  const userId = useSessionStore((s) => s.session?.userId ?? '')
  const selected = useLibraryStore((s) => s.selectedLibraryId)
  const libraries = useMusicLibraries()
  const libraryId = libraries.data?.some((l) => l.id === selected) ? (selected ?? undefined) : undefined
  return {
    ctx: { api, userId, libraryId },
    ready: libraries.isSuccess,
    key: [userId, libraryId ?? 'all'] as const,
  }
}

/** Consulta simple ligada al contexto de biblioteca. */
export function useLibraryQuery<T>(name: string, fetcher: (ctx: LibraryContext) => Promise<T>, ...params: unknown[]) {
  const { ctx, ready, key } = useLibraryContext()
  return useQuery({
    queryKey: [name, ...key, ...params],
    queryFn: () => fetcher(ctx),
    enabled: ready,
  })
}

/** Lista paginada (scroll infinito) ligada al contexto de biblioteca. */
export function useLibraryInfiniteQuery<T>(
  name: string,
  fetcher: (ctx: LibraryContext, page: PageRequest) => Promise<Page<T>>,
  ...params: unknown[]
) {
  const { ctx, ready, key } = useLibraryContext()
  return useInfiniteQuery({
    queryKey: [name, ...key, ...params],
    queryFn: ({ pageParam }) => fetcher(ctx, { startIndex: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (last) => {
      const next = last.startIndex + last.items.length
      return last.items.length > 0 && next < last.total ? next : undefined
    },
    enabled: ready,
  })
}
