import { Check, ChevronLeft, ChevronRight, Monitor, Moon, Sparkles, Sun, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useChangelogStore } from '../../changelog/changelogStore'
import { APP_NAME, APP_VERSION } from '../../core/config'
import { ACCENTS, useThemeStore, type ThemeMode } from '../../core/theme/themeStore'
const MODES: { id: ThemeMode; label: string; icon: LucideIcon }[] = [
  { id: 'system', label: 'Sistema', icon: Monitor },
  { id: 'light', label: 'Claro', icon: Sun },
  { id: 'dark', label: 'Oscuro', icon: Moon },
]

export function SettingsScreen() {
  const navigate = useNavigate()
  const { mode, accent, setMode, setAccent } = useThemeStore()
  const showAllChangelog = useChangelogStore((s) => s.showAll)

  return (
    <main className="px-5 pt-[max(env(safe-area-inset-top),16px)]">
      <button
        type="button"
        onClick={() => void navigate(-1)}
        className="-ml-2 flex h-12 items-center text-[1.0625rem] text-accent"
      >
        <ChevronLeft size={26} strokeWidth={2} aria-hidden />
        Atrás
      </button>
      <h1 className="screen-title pb-2">Ajustes</h1>

      <Section title="Tema">
        <div role="radiogroup" aria-label="Tema" className="grid grid-cols-3 gap-2">
          {MODES.map(({ id, label, icon: Icon }) => {
            const active = mode === id
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setMode(id)}
                className={`flex h-20 flex-col items-center justify-center gap-1.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? 'bg-surface text-accent ring-2 ring-accent' : 'bg-surface text-text-secondary'
                }`}
              >
                <Icon size={22} strokeWidth={2} aria-hidden />
                {label}
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="Color de acento">
        <div role="radiogroup" aria-label="Color de acento" className="flex gap-4">
          {ACCENTS.map((a) => {
            const active = accent === a.id
            return (
              <button
                key={a.id}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={a.label}
                onClick={() => setAccent(a.id)}
                className="flex size-12 items-center justify-center rounded-full"
                style={{ background: `linear-gradient(135deg, ${a.dark} 50%, ${a.light} 50%)` }}
              >
                {active && <Check size={22} strokeWidth={3} className="text-white drop-shadow" aria-hidden />}
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="Acerca de">
        <ul>
          <Row icon={Sparkles} label="Novedades" onClick={showAllChangelog} />
          <li className="flex min-h-14 items-center justify-between border-b border-divider text-base">
            <span>Versión</span>
            <span className="text-text-tertiary">
              {APP_NAME} {APP_VERSION}
            </span>
          </li>
        </ul>
      </Section>
    </main>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="label-caps mb-3 text-text-tertiary">{title}</h2>
      {children}
    </section>
  )
}

function Row({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <li className="border-b border-divider">
      <button type="button" onClick={onClick} className="flex min-h-14 w-full items-center gap-4 text-left">
        <Icon size={22} strokeWidth={2} className="text-accent" aria-hidden />
        <span className="flex-1 text-base">{label}</span>
        <ChevronRight size={20} strokeWidth={2} className="text-text-tertiary" aria-hidden />
      </button>
    </li>
  )
}
