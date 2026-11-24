import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { storageKeys } from '../../core/storage/storage'

const MAX = 8

interface SearchHistoryState {
  recent: string[]
  remember: (term: string) => void
  clear: () => void
}

/** Búsquedas recientes (las más nuevas primero, sin repetidos). */
export const useSearchHistory = create<SearchHistoryState>()(
  persist(
    (set) => ({
      recent: [],
      remember: (term) => {
        const t = term.trim()
        if (!t) return
        set((s) => ({ recent: [t, ...s.recent.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, MAX) }))
      },
      clear: () => set({ recent: [] }),
    }),
    { name: storageKeys.searchHistory },
  ),
)
