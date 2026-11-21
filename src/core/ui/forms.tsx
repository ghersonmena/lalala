import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { useId, useState, type ButtonHTMLAttributes, type InputHTMLAttributes } from 'react'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
}

export function TextField({ label, className = '', type, ...props }: TextFieldProps) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className={className}>
      <label htmlFor={id} className="label-caps mb-2 block text-text-tertiary">
        {label}
      </label>
      <div className="flex h-12 items-center rounded-xl bg-surface focus-within:ring-2 focus-within:ring-accent">
        <input
          id={id}
          type={isPassword && visible ? 'text' : type}
          className="h-full min-w-0 flex-1 bg-transparent px-4 text-base text-text-primary outline-none placeholder:text-text-tertiary"
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="flex size-12 items-center justify-center text-text-tertiary"
          >
            {visible ? <EyeOff size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
          </button>
        )}
      </div>
    </div>
  )
}

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
}

/** Botón principal: fondo de acento. Muestra un spinner mientras `loading`. */
export function PrimaryButton({ loading = false, disabled, children, className = '', ...props }: PrimaryButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent font-semibold text-white transition-opacity active:opacity-80 disabled:opacity-60 ${className}`}
    >
      {loading && <LoaderCircle size={20} className="animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-xl bg-surface px-4 py-3 text-sm leading-snug text-text-primary">
      {message}
    </p>
  )
}
