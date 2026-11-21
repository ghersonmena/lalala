import { useEffect, type ReactNode } from 'react'
import { resolveTheme, useThemeStore } from './themeStore'
import { transitionTheme } from './themeTransition'
import { useMediaQuery } from './useMediaQuery'

/**
 * Aplica tema y acento en <html>. El script de index.html ya pone el tema inicial antes del
 * primer pintado; aquí solo se reacciona a cambios (manuales o del sistema) con la transición circular.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useThemeStore((s) => s.mode)
  const accent = useThemeStore((s) => s.accent)
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)')
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const target = resolveTheme(mode, systemDark)

  useEffect(() => {
    if (document.documentElement.dataset.theme === target) return
    transitionTheme(target, reducedMotion)
  }, [target, reducedMotion])

  useEffect(() => {
    document.documentElement.dataset.accent = accent
  }, [accent])

  return children
}
