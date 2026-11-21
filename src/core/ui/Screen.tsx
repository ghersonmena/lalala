import type { ReactNode } from 'react'

interface Props {
  title: string
  /** Acción a la derecha del título (botón de perfil, "Editar", …) */
  action?: ReactNode
  children?: ReactNode
}

/** Contenedor estándar de pantalla: margen de 20px, título grande y safe area superior. */
export function Screen({ title, action, children }: Props) {
  return (
    <main className="px-5 pt-[max(env(safe-area-inset-top),16px)]">
      <header className="flex items-end justify-between gap-4 pt-6 pb-2">
        <h1 className="screen-title">{title}</h1>
        {action}
      </header>
      {children}
    </main>
  )
}

/** Estado vacío / marcador de contenido pendiente. */
export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mt-16 flex flex-col items-center text-center">
      <p className="font-display text-lg font-extrabold">{title}</p>
      {description && <p className="mt-2 max-w-72 text-[0.8125rem] text-text-secondary">{description}</p>}
    </div>
  )
}
