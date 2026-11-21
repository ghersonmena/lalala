import { create } from 'zustand'
import { readString, storageKeys, writeString } from '../core/storage/storage'
import { CHANGELOG, type ChangelogEntry } from './changelog'
import { latestVersion, unseenEntries } from './versions'

interface ChangelogState {
  open: boolean
  /** 'new' = solo lo no visto (automático), 'all' = historial completo (desde Ajustes) */
  view: 'new' | 'all'
  entries: ChangelogEntry[]
  /** Abre el modal automáticamente si hay versiones no vistas. */
  showUnseen: () => void
  showAll: () => void
  close: () => void
}

export const useChangelogStore = create<ChangelogState>()((set) => ({
  open: false,
  view: 'new',
  entries: [],
  showUnseen: () => {
    const unseen = unseenEntries(CHANGELOG, readString(storageKeys.changelogSeen))
    if (unseen.length > 0) set({ open: true, view: 'new', entries: unseen })
  },
  showAll: () => set({ open: true, view: 'all', entries: CHANGELOG }),
  close: () => {
    const latest = latestVersion(CHANGELOG)
    if (latest) writeString(storageKeys.changelogSeen, latest)
    set({ open: false })
  },
}))
