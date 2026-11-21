import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  labelledBy: string
  children: ReactNode
}

/** Modal accesible sobre <dialog> nativo (foco atrapado, Esc para cerrar). En móvil sube como hoja. */
export function Modal({ open, onClose, labelledBy, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // Foco en el propio diálogo (no en el primer botón) para no mostrar el anillo de foco al abrir
      dialog.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      tabIndex={-1}
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        // Clic en el fondo (fuera del contenido) cierra el modal
        if (e.target === e.currentTarget) onClose()
      }}
      className="m-auto mb-0 w-full border-0 outline-none max-w-[520px] rounded-t-3xl bg-surface-elevated p-0 text-text-primary backdrop:bg-black/60 backdrop:backdrop-blur-sm sm:mb-auto sm:rounded-3xl"
    >
      {children}
    </dialog>
  )
}
