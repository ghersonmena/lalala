import { CloudOff, LoaderCircle, RotateCw } from 'lucide-react'
import { useEffect, useEffectEvent, useRef } from 'react'
import { toAppError } from '../data/errors'

/** Error de carga con mensaje claro y botón de reintentar. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const offline = typeof navigator !== 'undefined' && !navigator.onLine
  const message = offline ? 'Sin conexión a internet.' : toAppError(error).message
  return (
    <div role="alert" className="mt-12 flex flex-col items-center px-6 text-center">
      <CloudOff size={36} strokeWidth={1.5} className="text-text-tertiary" aria-hidden />
      <p className="mt-3 font-display text-lg font-extrabold">No se pudo cargar</p>
      <p className="mt-1 max-w-72 text-[0.8125rem] text-text-secondary">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 flex h-12 items-center gap-2 rounded-xl bg-surface px-5 font-semibold text-accent"
        >
          <RotateCw size={18} aria-hidden />
          Reintentar
        </button>
      )}
    </div>
  )
}

/** Mensaje compacto para una sección vacía dentro de una pantalla. */
export function InlineEmpty({ children }: { children: string }) {
  return <p className="rounded-xl bg-surface px-4 py-5 text-center text-[0.8125rem] text-text-secondary">{children}</p>
}

export function AlbumCardSkeleton({ width }: { width?: number }) {
  return (
    <div style={width ? { width, flex: `0 0 ${width}px` } : undefined} aria-hidden>
      <div className="aspect-square w-full animate-pulse rounded-[10px] bg-surface" />
      <div className="mt-2 h-3.5 w-4/5 animate-pulse rounded bg-surface" />
      <div className="mt-1.5 h-3 w-3/5 animate-pulse rounded bg-surface" />
    </div>
  )
}

export function RowSkeleton({ withCover = true }: { withCover?: boolean }) {
  return (
    <div className="flex h-16 items-center gap-3" aria-hidden>
      {withCover && <div className="size-12 animate-pulse rounded-md bg-surface" />}
      <div className="flex-1">
        <div className="h-3.5 w-3/5 animate-pulse rounded bg-surface" />
        <div className="mt-2 h-3 w-2/5 animate-pulse rounded bg-surface" />
      </div>
    </div>
  )
}

export function Spinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex justify-center py-6 text-text-tertiary" role="status" aria-label={label}>
      <LoaderCircle size={24} className="animate-spin" aria-hidden />
    </div>
  )
}

/** Dispara `onVisible` al acercarse al final de la lista (scroll infinito). */
export function InfiniteSentinel({ onVisible, loading }: { onVisible: () => void; loading: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const handleVisible = useEffectEvent(onVisible)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) handleVisible()
    }, { rootMargin: '600px 0px' })
    observer.observe(el)
    return () => observer.disconnect()
    // Se vuelve a observar al terminar cada carga: si el final sigue visible, pide la siguiente página.
  }, [loading])
  return <div ref={ref}>{loading && <Spinner />}</div>
}
