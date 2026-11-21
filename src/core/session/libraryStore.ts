import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { storageKeys } from '../storage/storage'

interface LibraryState {
  /** Biblioteca de música elegida; null = todas. */
  selectedLibraryId: string | null
  selectLibrary: (id: string | null) => void
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set) => ({
      selectedLibraryId: null,
      selectLibrary: (selectedLibraryId) => set({ selectedLibraryId }),
    }),
    { name: storageKeys.library },
  ),
)
