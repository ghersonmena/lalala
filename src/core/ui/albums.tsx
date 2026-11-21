import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { Album } from '../model/library'
import { Cover } from './Cover'

/** Sección de pantalla: título + enlace "Ver todo" opcional. Separación de 28px. */
export function Section({ title, seeAllTo, children }: { title: string; seeAllTo?: string; children: ReactNode }) {
  return (
    <section className="mt-7">
      <header className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="section-title">{title}</h2>
        {seeAllTo && (
          <Link to={seeAllTo} className="-my-3 py-3 text-[0.9375rem] text-accent">
            Ver todo
          </Link>
        )}
      </header>
      {children}
    </section>
  )
}

/** Fila horizontal desplazable que llega a los bordes de la pantalla. */
export function Carousel({ children }: { children: ReactNode }) {
  return (
    <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3.5 overflow-x-auto px-5 pb-1">
      {children}
    </div>
  )
}

export function AlbumCard({ album, width }: { album: Album; width?: number }) {
  return (
    <Link
      to={`/album/${album.id}`}
      className="block min-w-0 snap-start active:opacity-70"
      style={width ? { width, flex: `0 0 ${width}px` } : undefined}
    >
      <Cover image={album.image} size={width ?? 220} className="w-full rounded-[10px]" />
      <p className="mt-2 truncate text-sm font-medium">{album.name}</p>
      <p className="truncate text-[0.8125rem] text-text-secondary">{album.artistName}</p>
    </Link>
  )
}

export function AlbumGrid({ albums }: { albums: Album[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-5">
      {albums.map((a) => (
        <AlbumCard key={a.id} album={a} />
      ))}
    </div>
  )
}

export function AlbumCarousel({ albums }: { albums: Album[] }) {
  return (
    <Carousel>
      {albums.map((a) => (
        <AlbumCard key={a.id} album={a} width={150} />
      ))}
    </Carousel>
  )
}
