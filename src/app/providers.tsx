import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { isUnauthorized } from '../core/data/errors'
import { ThemeProvider } from '../core/theme/ThemeProvider'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      // Un 401 no se reintenta: la sesión ya se cerró.
      retry: (failureCount, error) => !isUnauthorized(error) && failureCount < 1,
    },
  },
})

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryClientProvider>
  )
}
