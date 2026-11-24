import { currentTrack, isPlaying, usePlayerStore } from './playerStore'

/** ¿Esta canción es la que suena? (para el ecualizador y el título en acento). */
export function useNowPlaying(trackId: string): { active: boolean; playing: boolean } {
  const active = usePlayerStore((s) => currentTrack(s)?.id === trackId)
  const playing = usePlayerStore((s) => active && isPlaying(s))
  return { active, playing }
}
