/** Ícono de ecualizador para la canción que suena; las barras se mueven solo mientras reproduce. */
export function Equalizer({ playing, className = '' }: { playing: boolean; className?: string }) {
  return (
    <span className={`inline-flex h-3.5 items-end gap-[2px] text-accent ${className}`} aria-label="Reproduciendo" role="img">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full bg-current ${playing ? 'animate-eq' : ''}`}
          style={{ height: playing ? undefined : `${[60, 100, 40][i]}%`, animationDelay: `${i * -0.25}s` }}
        />
      ))}
    </span>
  )
}
