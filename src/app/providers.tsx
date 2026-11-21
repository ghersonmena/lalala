import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { isPermanentError } from '../core/data/errors'
import { ThemeProvider } from '../core/theme/ThemeProvider'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      // 401/403/404 no se reintentan (la sesión ya se cerró o el elemento no existe).
      retry: (failureCount, error) => !isPermanentError(error) && failureCount < 1,
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
