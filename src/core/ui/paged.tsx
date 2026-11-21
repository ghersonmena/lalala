import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type { Page } from '../model/library'
import { ErrorState, InfiniteSentinel } from './states'
import { EmptyState } from './Screen'

interface Props<T> {
  query: UseInfiniteQueryResult<InfiniteData<Page<T>>>
  skeleton: ReactNode
  empty: { title: string; description?: string }
  children: (items: T[]) => ReactNode
}

/** Maneja carga, error, vacío y scroll infinito de una lista paginada. */
export function PagedList<T>({ query, skeleton, empty, children }: Props<T>) {
  if (query.isPending) return <>{skeleton}</>
  if (query.isError && !query.data) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />

  const items = query.data?.pages.flatMap((p) => p.items) ?? []
  if (items.length === 0) return <EmptyState title={empty.title} description={empty.description} />

  return (
    <>
      {children(items)}
      {query.hasNextPage && (
        <InfiniteSentinel
          loading={query.isFetchingNextPage}
          onVisible={() => {
            if (!query.isFetchingNextPage) void query.fetchNextPage()
          }}
        />
      )}
    </>
  )
}
