import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { storageKeys } from '../storage/storage'

export type ThemeMode = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'
export type AccentId = 'coral' | 'pink' | 'violet' | 'teal'

export const ACCENTS: { id: AccentId; label: string; dark: string; light: string }[] = [
  { id: 'coral', label: 'Coral', dark: '#FF6A3D', light: '#D4501F' },
  { id: 'pink', label: 'Rosa', dark: '#FF3B6B', light: '#D81E4F' },
  { id: 'violet', label: 'Violeta', dark: '#7C6CFF', light: '#5B4BE0' },
  { id: 'teal', label: 'Turquesa', dark: '#2EC4B6', light: '#178F84' },
]

/** Color de fondo de cada tema; se usa para `<meta name="theme-color">`. */
export const THEME_BACKGROUND: Record<ResolvedTheme, string> = {
  dark: '#0E0E10',
  light: '#F5F5F7',
}

interface ThemeState {
  mode: ThemeMode
  accent: AccentId
  setMode: (mode: ThemeMode) => void
  setAccent: (accent: AccentId) => void
}

// La forma persistida ({ state: { mode, accent } }) la lee también el script inline de index.html.
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      accent: 'coral',
      setMode: (mode) => set({ mode }),
      setAccent: (accent) => set({ accent }),
    }),
    {
      name: storageKeys.prefs,
      partialize: ({ mode, accent }) => ({ mode, accent }),
    },
  ),
)

export function resolveTheme(mode: ThemeMode, systemPrefersDark: boolean): ResolvedTheme {
  if (mode === 'system') return systemPrefersDark ? 'dark' : 'light'
  return mode
}
