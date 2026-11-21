import { useMutation } from '@tanstack/react-query'
import { Server } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { login } from '../../core/data/authRepository'
import type { ServerInfo } from '../../core/model/session'
import { useSessionStore } from '../../core/session/sessionStore'
import { FormError, PrimaryButton, TextField } from '../../core/ui/forms'

interface Props {
  server: ServerInfo
  onChangeServer: () => void
}

export function CredentialsStep({ server, onChangeServer }: Props) {
  const navigate = useNavigate()
  const signIn = useSessionStore((s) => s.signIn)
  const expired = useSessionStore((s) => s.expired)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const mutation = useMutation({
    mutationFn: () => login(server, username, password),
    onSuccess: (session) => {
      signIn(session)
      void navigate('/', { replace: true })
    },
  })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3">
        <Server size={22} className="shrink-0 text-accent" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{server.name}</p>
          <p className="truncate text-[0.8125rem] text-text-tertiary">
            {hostOf(server.url)} · Jellyfin {server.version}
          </p>
        </div>
        <button
          type="button"
          onClick={onChangeServer}
          disabled={mutation.isPending}
          className="h-12 shrink-0 px-1 text-[0.9375rem] text-accent"
        >
          Cambiar
        </button>
      </div>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          mutation.mutate()
        }}
        className="flex flex-col gap-5"
      >
        <header>
          <h1 className="screen-title">Inicia sesión</h1>
          <p className="mt-2 text-[0.9375rem] text-text-secondary">Usa tu usuario de Jellyfin.</p>
        </header>

        {expired && !mutation.error && <FormError message="Tu sesión expiró. Vuelve a iniciar sesión." />}

        <TextField
          label="Usuario"
          autoComplete="username"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={mutation.isPending}
        />
        <TextField
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={mutation.isPending}
        />

        <FormError message={mutation.error?.message} />

        <PrimaryButton type="submit" loading={mutation.isPending}>
          Iniciar sesión
        </PrimaryButton>
      </form>
    </div>
  )
}

function hostOf(url: string) {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}
