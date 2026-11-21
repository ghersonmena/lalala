import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { storageKeys } from '../core/storage/storage'
import { CHANGELOG } from './changelog'
import { ChangelogModal } from './ChangelogModal'
import { useChangelogStore } from './changelogStore'

beforeAll(() => {
  // jsdom no implementa showModal/close de <dialog>
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function () {
    this.open = false
  }
})

beforeEach(() => {
  localStorage.clear()
  useChangelogStore.setState({ open: false, view: 'new', entries: [] })
})

afterEach(cleanup)

const latest = CHANGELOG[0]!.version

describe('ChangelogModal', () => {
  it('se abre en el primer uso y al cerrarlo guarda la versión vista', () => {
    render(<ChangelogModal />)
    expect(screen.getByText(`Versión ${latest}`)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Entendido' }))
    expect(localStorage.getItem(storageKeys.changelogSeen)).toBe(latest)
    expect(useChangelogStore.getState().open).toBe(false)
  })

  it('no se abre si ya se vio la última versión', () => {
    localStorage.setItem(storageKeys.changelogSeen, latest)
    render(<ChangelogModal />)
    expect(useChangelogStore.getState().open).toBe(false)
  })

  it('el historial completo se puede abrir aunque ya se haya visto', () => {
    localStorage.setItem(storageKeys.changelogSeen, latest)
    render(<ChangelogModal />)
    act(() => useChangelogStore.getState().showAll())
    expect(screen.getByText('Historial de versiones')).toBeTruthy()
    expect(screen.getAllByText(/^Versión /)).toHaveLength(CHANGELOG.length)
  })
})
