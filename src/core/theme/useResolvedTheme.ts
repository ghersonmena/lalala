import { resolveTheme, useThemeStore, type ResolvedTheme } from './themeStore'
import { useMediaQuery } from './useMediaQuery'

/** Tema efectivo ('light' | 'dark') según el modo elegido y el del sistema. */
export function useResolvedTheme(): ResolvedTheme {
  const mode = useThemeStore((s) => s.mode)
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)')
  return resolveTheme(mode, systemDark)
}
