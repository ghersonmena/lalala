import { Heart, Sparkles, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Section } from '../../core/ui/albums'

interface MixCard {
  to: string
  label: string
  title: string
  subtitle: string
  icon: LucideIcon
  gradient: string
}

const CARDS: MixCard[] = [
  {
    to: '/mix',
    label: 'Mix',
    title: 'Mix de la semana',
    subtitle: 'A partir de lo que más escuchas',
    icon: Sparkles,
    gradient: 'linear-gradient(160deg, #FF8A4C 0%, #E2366B 55%, #6A2FB8 100%)',
  },
  {
    to: '/favorites',
    label: 'Tu música',
    title: 'Favoritas',
    subtitle: 'Las canciones que marcaste con ♥',
    icon: Heart,
    gradient: 'linear-gradient(160deg, #FF5E8A 0%, #C2185B 50%, #3B1340 100%)',
  },
]

/** "Hecho para ti": dos tarjetas grandes con degradado (196px de alto, radio 14px). */
export function MadeForYou() {
  return (
    <Section title="Hecho para ti">
      <div className="grid grid-cols-2 gap-3.5">
        {CARDS.map(({ to, label, title, subtitle, icon: Icon, gradient }) => (
          <Link
            key={to}
            to={to}
            viewTransition
            className="relative flex h-[196px] flex-col justify-between overflow-hidden rounded-[14px] p-4 text-white shadow-[0_12px_30px_-14px_rgba(0,0,0,0.5)] active:scale-[0.98] transition-transform"
            style={{ background: gradient }}
          >
            <span className="label-caps opacity-85">{label}</span>
            <Icon size={64} strokeWidth={1.5} className="absolute -right-2 bottom-12 opacity-20" aria-hidden />
            <span>
              <span className="block font-display text-[1.1875rem] leading-tight font-extrabold">{title}</span>
              <span className="mt-1 block text-xs leading-snug opacity-85">{subtitle}</span>
            </span>
          </Link>
        ))}
      </div>
    </Section>
  )
}
