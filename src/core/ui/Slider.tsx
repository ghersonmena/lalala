import { useEffect, useRef, useState, type CSSProperties } from 'react'

interface Props {
  value: number
  max: number
  label: string
  /** Se llama al soltar (o con teclado): aquí se hace el seek real. */
  onCommit: (value: number) => void
  /** Valor mientras se arrastra (para mostrar el tiempo antes de soltar). */
  onScrub?: (value: number | null) => void
  step?: number
  valueText?: string
  fillColor?: string
  trackColor?: string
}

/** Deslizador accesible (input range) que solo confirma el valor al soltar. */
export function Slider({ value, max, label, onCommit, onScrub, step = 1, valueText, fillColor, trackColor }: Props) {
  const ref = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState<number | null>(null)
  const shown = drag ?? value
  const fill = max > 0 ? Math.min(100, (shown / max) * 100) : 0

  // El evento nativo "change" ocurre al soltar; React onChange ocurre en cada movimiento.
  const commit = useRef(onCommit)
  const scrub = useRef(onScrub)
  useEffect(() => {
    commit.current = onCommit
    scrub.current = onScrub
  })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onChange = () => {
      commit.current(Number(el.value))
      setDrag(null)
      scrub.current?.(null)
    }
    el.addEventListener('change', onChange)
    return () => el.removeEventListener('change', onChange)
  }, [])

  return (
    <input
      ref={ref}
      type="range"
      className="slider"
      min={0}
      max={max || 1}
      step={step}
      value={shown}
      aria-label={label}
      aria-valuetext={valueText}
      onChange={(e) => {
        const v = Number(e.target.value)
        setDrag(v)
        onScrub?.(v)
      }}
      style={
        {
          '--fill': `${fill}%`,
          '--slider-fill': fillColor ?? 'currentColor',
          '--slider-track': trackColor ?? 'color-mix(in srgb, currentColor 25%, transparent)',
        } as CSSProperties
      }
    />
  )
}
