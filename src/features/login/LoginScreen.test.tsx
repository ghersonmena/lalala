import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../core/data/errors'
import type { ServerInfo, Session } from '../../core/model/session'
import { useSessionStore } from '../../core/session/sessionStore'
import { LoginScreen } from './LoginScreen'

const SERVER: ServerInfo = { url: 'https://jellyfin.example.com', id: 'srv', name: 'Casa', version: '10.11.0' }

const repo = vi.hoisted(() => ({
  validateServer: vi.fn(),
  login: vi.fn(),
}))
vi.mock('../../core/data/authRepository', () => repo)

function renderLogin() {
  const router = createMemoryRouter(
    [
      { path: '/login', element: <LoginScreen /> },
      { path: '/', element: <p>Inicio</p> },
    ],
    { initialEntries: ['/login'] },
  )
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
  useSessionStore.setState({ server: null, session: null, expired: false })
  repo.validateServer.mockReset()
  repo.login.mockReset()
})

afterEach(cleanup)

describe('LoginScreen', () => {
  it('primero valida el servidor y después pide usuario y contraseña', async () => {
    repo.validateServer.mockResolvedValue(SERVER)
    const session: Session = { server: SERVER, userId: 'u1', userName: 'Ana', accessToken: 'tok' }
    repo.login.mockResolvedValue(session)
    renderLogin()

    expect(screen.queryByLabelText('Usuario')).toBeNull()
    fireEvent.change(screen.getByLabelText('Servidor'), { target: { value: 'jellyfin.example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(await screen.findByText('Casa')).toBeTruthy()
    expect(repo.validateServer).toHaveBeenCalledWith('jellyfin.example.com')

    fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: 'ana' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'secreta' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    expect(await screen.findByText('Inicio')).toBeTruthy()
    expect(repo.login).toHaveBeenCalledWith(SERVER, 'ana', 'secreta')
    expect(useSessionStore.getState().session).toEqual(session)
    // La contraseña nunca se guarda
    expect(JSON.stringify(localStorage)).not.toContain('secreta')
  })

  it('muestra el error si el servidor no es válido y no avanza', async () => {
    repo.validateServer.mockRejectedValue(new AppError('not-jellyfin', 'Esa dirección responde, pero no es un servidor Jellyfin.'))
    renderLogin()

    fireEvent.change(screen.getByLabelText('Servidor'), { target: { value: 'example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    expect((await screen.findByRole('alert')).textContent).toContain('no es un servidor Jellyfin')
    expect(screen.queryByLabelText('Usuario')).toBeNull()
  })

  it('con un servidor ya validado va directo al login y permite cambiarlo', async () => {
    useSessionStore.setState({ server: SERVER })
    renderLogin()

    expect(screen.getByLabelText('Usuario')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar' }))
    expect(await screen.findByLabelText('Servidor')).toBeTruthy()
  })
})
