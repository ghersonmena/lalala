import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MusicLibrary } from '../../core/model/library'
import { useLibraryStore } from '../../core/session/libraryStore'
import { useSessionStore } from '../../core/session/sessionStore'
import { LibraryPicker } from './LibraryPicker'

const repo = vi.hoisted(() => ({ getMusicLibraries: vi.fn() }))
vi.mock('../../core/data/libraryRepository', () => repo)

const SERVER = { url: 'https://jf.example.com', id: 's', name: 'Casa', version: '10.11.0' }

function renderPicker() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <LibraryPicker />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
  useSessionStore.setState({ session: { server: SERVER, userId: 'u', userName: 'Ana', accessToken: 't' } })
  useLibraryStore.setState({ selectedLibraryId: null })
})
afterEach(cleanup)

describe('LibraryPicker', () => {
  it('no aparece con una sola biblioteca', async () => {
    repo.getMusicLibraries.mockResolvedValue([{ id: 'l1', name: 'Música' }] satisfies MusicLibrary[])
    renderPicker()
    await new Promise((r) => setTimeout(r, 20))
    expect(screen.queryByRole('radiogroup')).toBeNull()
  })

  it('con varias bibliotecas muestra "Todas" + cada una y recuerda la elección', async () => {
    repo.getMusicLibraries.mockResolvedValue([
      { id: 'l1', name: 'Música' },
      { id: 'l2', name: 'Vinilos' },
    ] satisfies MusicLibrary[])
    renderPicker()

    const all = await screen.findByRole('radio', { name: 'Todas' })
    expect(all.getAttribute('aria-checked')).toBe('true')

    fireEvent.click(screen.getByRole('radio', { name: 'Vinilos' }))
    expect(useLibraryStore.getState().selectedLibraryId).toBe('l2')
    expect(screen.getByRole('radio', { name: 'Vinilos' }).getAttribute('aria-checked')).toBe('true')
  })
})
