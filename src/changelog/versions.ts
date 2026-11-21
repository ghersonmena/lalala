import type { ChangelogEntry } from './changelog'

/** Compara versiones semver simples (x.y.z). Negativo si a < b, 0 si iguales, positivo si a > b. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((n) => Number.parseInt(n, 10) || 0)
  const pb = b.split('.').map((n) => Number.parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

/**
 * Entradas que el usuario aún no ha visto.
 * Si nunca vio ninguna (primer uso), solo se muestra la más reciente para no saturar.
 */
export function unseenEntries(entries: ChangelogEntry[], lastSeen: string | null): ChangelogEntry[] {
  if (entries.length === 0) return []
  if (!lastSeen) return entries.slice(0, 1)
  return entries.filter((e) => compareVersions(e.version, lastSeen) > 0)
}

export function latestVersion(entries: ChangelogEntry[]): string | null {
  return entries[0]?.version ?? null
}
