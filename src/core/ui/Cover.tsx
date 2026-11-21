import { Disc3, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { useImageUrl } from '../data/images'
import type { ImageRef } from '../model/library'

interface Props {
  image: ImageRef | null
  /** Tamaño en px CSS con el que se pide la imagen al servidor. */
  size: number
  alt?: string
  className?: string
  /** Ícono si no hay imagen o no carga. */
  fallbackIcon?: LucideIcon
  round?: boolean
}

/** Portada cuadrada: placeholder mientras carga, fundido al aparecer y respaldo si falla. */
export function Cover({ image, size, alt = '', className = '', fallbackIcon, round = false }: Props) {
  const src = useImageUrl(image, size)
  return (
    <div
      className={`relative aspect-square shrink-0 overflow-hidden bg-surface ${round ? 'rounded-full' : ''} ${className}`}
    >
      {/* key: al cambiar de imagen se reinicia el estado de carga */}
      <CoverContent key={src ?? 'none'} src={src} alt={alt} size={size} icon={fallbackIcon ?? Disc3} />
    </div>
  )
}

function CoverContent({ src, alt, size, icon: Icon }: { src: string | null; alt: string; size: number; icon: LucideIcon }) {
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading')
  const showImage = src && state !== 'error'
  return (
    <>
      {state !== 'loaded' && (
        <Icon
          className="absolute inset-0 m-auto text-text-tertiary/60"
          size={Math.max(18, Math.min(56, size * 0.3))}
          strokeWidth={1.5}
          aria-hidden
        />
      )}
      {showImage && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          draggable={false}
          onLoad={() => setState('loaded')}
          onError={() => setState('error')}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ${
            state === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </>
  )
}
