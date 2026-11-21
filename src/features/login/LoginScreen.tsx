import { useMutation } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Navigate } from 'react-router'
import { APP_ICON_URL, APP_NAME, DEFAULT_SERVER_URL } from '../../core/config'
import { validateServer } from '../../core/data/authRepository'
import { useSessionStore } from '../../core/session/sessionStore'
import { CredentialsStep } from './CredentialsStep'
import { ServerStep } from './ServerStep'

// El servidor del .env se intenta validar automáticamente solo una vez por carga de la app;
// si el usuario toca "Cambiar servidor" ya no se vuelve a forzar.
let defaultServerTried = false

/** Flujo de entrada: 1) servidor (validado) → 2) usuario y contraseña. */
export function LoginScreen() {
  const session = useSessionStore((s) => s.session)
  const server = useSessionStore((s) => s.server)
  const setServer = useSessionStore((s) => s.setServer)
  const forgetServer = useSessionStore((s) => s.forgetServer)

  const validation = useMutation({
    mutationFn: (url: string) => validateServer(url),
    onSuccess: setServer,
  })
  const { mutate: validate } = validation

  useEffect(() => {
    if (!server && DEFAULT_SERVER_URL && !defaultServerTried) {
      defaultServerTried = true
      validate(DEFAULT_SERVER_URL)
    }
  }, [server, validate])

  if (session) return <Navigate to="/" replace />

  return (
    <main className="mx-auto flex min-h-dvh max-w-[440px] flex-col px-5 pt-[max(env(safe-area-inset-top),40px)] pb-[max(env(safe-area-inset-bottom),24px)]">
      <div className="flex items-center gap-3">
        <img src={APP_ICON_URL} alt="" className="size-11 rounded-xl" />
        <span className="font-display text-xl font-extrabold">{APP_NAME}</span>
      </div>

      <div className="mt-12 flex-1">
        {server ? (
          <CredentialsStep
            server={server}
            onChangeServer={() => {
              validation.reset()
              forgetServer()
            }}
          />
        ) : (
          <ServerStep
            initialUrl={DEFAULT_SERVER_URL}
            pending={validation.isPending}
            error={validation.error?.message}
            onSubmit={(url) => validate(url)}
          />
        )}
      </div>
    </main>
  )
}
