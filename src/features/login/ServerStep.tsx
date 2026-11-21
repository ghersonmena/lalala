import { useState } from 'react'
import { FormError, PrimaryButton, TextField } from '../../core/ui/forms'

interface Props {
  initialUrl: string
  pending: boolean
  error?: string
  onSubmit: (url: string) => void
}

export function ServerStep({ initialUrl, pending, error, onSubmit }: Props) {
  const [url, setUrl] = useState(initialUrl)

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(url)
      }}
      className="flex flex-col gap-5"
    >
      <header>
        <h1 className="screen-title">Conecta tu servidor</h1>
        <p className="mt-2 text-[0.9375rem] text-text-secondary">
          Escribe la dirección de tu servidor Jellyfin. Puede ser tu dominio o la IP de tu red local.
        </p>
      </header>

      <TextField
        label="Servidor"
        type="url"
        inputMode="url"
        autoComplete="url"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="https://jellyfin.midominio.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        disabled={pending}
      />

      <FormError message={error} />

      <PrimaryButton type="submit" loading={pending}>
        {pending ? 'Buscando servidor…' : 'Continuar'}
      </PrimaryButton>
    </form>
  )
}
