import { useEffect } from 'react'
import { APP_NAME } from '../core/config'
import { Modal } from '../core/ui/Modal'
import type { ChangeType } from './changelog'
import { useChangelogStore } from './changelogStore'

const TYPE_LABEL: Record<ChangeType, string> = {
  nuevo: 'Nuevo',
  mejora: 'Mejora',
  arreglo: 'Arreglo',
}

const dateFormat = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric' })

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return dateFormat.format(new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1))
}

/** Modal de Novedades. Se muestra solo una vez por versión nueva; el historial completo se abre desde Ajustes. */
export function ChangelogModal() {
  const { open, view, entries, showUnseen, close } = useChangelogStore()

  useEffect(() => {
    showUnseen()
  }, [showUnseen])

  return (
    <Modal open={open} onClose={close} labelledBy="changelog-title">
      <div className="flex max-h-[80dvh] flex-col">
        <header className="px-5 pt-6 pb-3">
          <p className="label-caps text-accent">{view === 'all' ? 'Historial de versiones' : `${APP_NAME} se actualizó`}</p>
          <h2 id="changelog-title" className="section-title mt-1">
            Novedades
          </h2>
        </header>

        <div className="flex-1 overflow-y-auto px-5">
          {entries.map((entry) => (
            <section key={entry.version} className="border-b border-divider py-4 last:border-b-0">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-base font-extrabold">Versión {entry.version}</h3>
                <time dateTime={entry.date} className="text-[0.8125rem] text-text-tertiary">
                  {formatDate(entry.date)}
                </time>
              </div>
              <ul className="mt-2 space-y-2">
                {entry.items.map((item, i) => (
                  <li key={i} className="flex gap-3 text-[0.9375rem] leading-snug">
                    <span className="label-caps mt-0.5 w-16 shrink-0 text-text-tertiary">{TYPE_LABEL[item.type]}</span>
                    <span className="text-text-secondary">{item.text}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <footer className="px-5 pt-3 pb-[max(env(safe-area-inset-bottom),20px)]">
          <button
            type="button"
            onClick={close}
            className="h-12 w-full rounded-xl bg-surface font-semibold text-accent active:opacity-80"
          >
            Entendido
          </button>
        </footer>
      </div>
    </Modal>
  )
}
