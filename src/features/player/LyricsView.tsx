import { useEffect, useRef } from 'react'
import { getLyrics } from '../../core/data/libraryRepository'
import { useLibraryQuery } from '../../core/data/libraryQueries'
import type { Track } from '../../core/model/library'
import { seek, usePlayerStore } from '../../playback'

/** Adelanto para que la línea se resalte justo cuando empieza a cantarse. */
const LEAD_MS = 250
/** Tras desplazar a mano, se pausa el auto-scroll este tiempo. */
const MANUAL_SCROLL_PAUSE_MS = 4000

/** Letras de la canción: sincronizadas (línea actual resaltada, auto-scroll, tocar = saltar) o texto simple. */
export function LyricsView({ track }: { track: Track }) {
  const lyrics = useLibraryQuery('lyrics', (ctx) => getLyrics(ctx, track.id), track.id)
  const position = usePlayerStore((s) => s.positionMs)
  const lineRefs = useRef<(HTMLElement | null)[]>([])
  const manualScrollAt = useRef(0)

  const data = lyrics.data
  const synced = data?.synced ?? false
  let active = -1
  if (data && synced) {
    for (let i = 0; i < data.lines.length; i++) {
      const start = data.lines[i]!.startMs
      if (start !== null && start <= position + LEAD_MS) active = i
      else if (start !== null) break
    }
  }

  useEffect(() => {
    if (active < 0 || Date.now() - manualScrollAt.current < MANUAL_SCROLL_PAUSE_MS) return
    lineRefs.current[active]?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [active])

  if (lyrics.isPending) return <Message text="Cargando letra…" />
  if (lyrics.isError) return <Message text="No se pudo cargar la letra." />
  if (!data) return <Message text="Esta canción no tiene letra." />

  return (
    <div
      className="no-scrollbar h-full overflow-y-auto py-[30%] [mask-image:linear-gradient(transparent,#000_12%,#000_88%,transparent)]"
      onWheel={() => (manualScrollAt.current = Date.now())}
      onTouchMove={() => (manualScrollAt.current = Date.now())}
    >
      {data.lines.map((line, i) => {
        const isActive = i === active
        const content = line.text || '♪'
        return synced && line.startMs !== null ? (
          <button
            key={i}
            ref={(el) => {
              lineRefs.current[i] = el
            }}
            type="button"
            onClick={() => seek(line.startMs!)}
            className={`block w-full py-2 text-left font-display text-[1.625rem] leading-snug font-extrabold transition-opacity duration-300 ${
              isActive ? 'opacity-100' : 'opacity-35'
            }`}
            aria-current={isActive ? 'true' : undefined}
          >
            {content}
          </button>
        ) : (
          <p key={i} className="py-1.5 text-xl leading-relaxed font-semibold opacity-90">
            {line.text}
          </p>
        )
      })}
    </div>
  )
}

function Message({ text }: { text: string }) {
  return <p className="flex h-full items-center justify-center text-center text-base opacity-70">{text}</p>
}
