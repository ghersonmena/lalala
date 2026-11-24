import { useQueryClient } from '@tanstack/react-query'
import { ListMusic, LoaderCircle, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { create } from 'zustand'
import { getPlaylists } from '../../core/data/libraryRepository'
import { useLibraryQuery } from '../../core/data/libraryQueries'
import { addToPlaylist, createPlaylist, invalidatePlaylists } from '../../core/data/playlists'
import { songsLabel } from '../../core/format'
import type { Track } from '../../core/model/library'
import { Cover } from '../../core/ui/Cover'
import { PrimaryButton, TextField } from '../../core/ui/forms'
import { Modal } from '../../core/ui/Modal'
import { Spinner } from '../../core/ui/states'
import { showToast } from '../../core/ui/Toast'

interface State {
  open: boolean
  /** Canciones a agregar. Vacío = solo crear una playlist nueva. */
  tracks: Track[]
}

const useAddToPlaylistStore = create<State>()(() => ({ open: false, tracks: [] }))

/** Abre la hoja para agregar canciones a una playlist (o crear una nueva con ellas). */
export function openAddToPlaylist(tracks: Track[]) {
  useAddToPlaylistStore.setState({ open: true, tracks })
}

/** Abre la hoja solo para crear una playlist vacía. */
export function openCreatePlaylist() {
  useAddToPlaylistStore.setState({ open: true, tracks: [] })
}

const close = () => useAddToPlaylistStore.setState({ open: false, tracks: [] })

export function AddToPlaylistSheet() {
  const { open, tracks } = useAddToPlaylistStore()
  return (
    <Modal open={open} onClose={close} labelledBy="add-to-playlist-title">
      {/* Se monta de nuevo en cada apertura: el formulario empieza limpio */}
      {open && <SheetContent tracks={tracks} />}
    </Modal>
  )
}

function SheetContent({ tracks }: { tracks: Track[] }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const onlyCreate = tracks.length === 0
  const [creating, setCreating] = useState(onlyCreate)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const playlists = useLibraryQuery('playlists', getPlaylists)
  const ids = tracks.map((t) => t.id)
  const what = tracks.length === 1 ? 'Agregada' : `${songsLabel(tracks.length)} agregadas`

  const add = async (playlistId: string, playlistName: string) => {
    setBusy(playlistId)
    try {
      await addToPlaylist(playlistId, ids)
      invalidatePlaylists(queryClient, playlistId)
      showToast(`${what} a ${playlistName}`)
      close()
    } catch {
      showToast('No se pudo agregar a la playlist')
      setBusy(null)
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setBusy('new')
    try {
      const id = await createPlaylist(trimmed, ids)
      invalidatePlaylists(queryClient, id)
      showToast(onlyCreate ? `Playlist "${trimmed}" creada` : `${what} a ${trimmed}`)
      close()
      if (onlyCreate) void navigate(`/playlist/${id}`, { viewTransition: true })
    } catch {
      showToast('No se pudo crear la playlist')
      setBusy(null)
    }
  }

  return (
    <div className="flex max-h-[80dvh] flex-col px-5 pt-5 pb-[max(env(safe-area-inset-bottom),16px)]">
      <h2 id="add-to-playlist-title" className="font-display text-[1.3125rem] font-extrabold">
        {onlyCreate ? 'Nueva playlist' : 'Agregar a una playlist'}
      </h2>
      {!onlyCreate && (
        <p className="mt-0.5 truncate text-[0.8125rem] text-text-secondary">
          {tracks.length === 1 && tracks[0] ? `${tracks[0].name} · ${tracks[0].artistName}` : songsLabel(tracks.length)}
        </p>
      )}

      {creating ? (
        <form onSubmit={(e) => void submit(e)} className="mt-4 flex flex-col gap-3">
          <TextField
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            autoFocus
            enterKeyHint="done"
          />
          <PrimaryButton type="submit" loading={busy === 'new'} disabled={!name.trim()}>
            {onlyCreate ? 'Crear playlist' : 'Crear y agregar'}
          </PrimaryButton>
          {!onlyCreate && (
            <button type="button" onClick={() => setCreating(false)} className="h-12 font-medium text-accent">
              Elegir una existente
            </button>
          )}
        </form>
      ) : (
        <ul className="-mx-5 mt-3 min-h-0 overflow-y-auto border-t border-divider px-5">
          <li className="border-b border-divider">
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex min-h-16 w-full items-center gap-4 text-left active:opacity-60"
            >
              <span className="flex size-12 items-center justify-center rounded-md bg-surface text-accent">
                <Plus size={24} aria-hidden />
              </span>
              <span className="text-base font-medium text-accent">Nueva playlist</span>
            </button>
          </li>
          {playlists.isPending ? (
            <li>
              <Spinner />
            </li>
          ) : playlists.isError ? (
            <li className="py-6 text-center text-sm text-text-secondary">No se pudieron cargar tus playlists.</li>
          ) : (
            playlists.data.map((p) => (
              <li key={p.id} className="border-b border-divider last:border-b-0">
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void add(p.id, p.name)}
                  className="flex min-h-16 w-full items-center gap-4 text-left active:opacity-60 disabled:opacity-60"
                >
                  <Cover image={p.image} size={48} fallbackIcon={ListMusic} className="w-12 rounded-md" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base">{p.name}</span>
                    {p.trackCount != null && (
                      <span className="block text-[0.8125rem] text-text-secondary">{songsLabel(p.trackCount)}</span>
                    )}
                  </span>
                  {busy === p.id && <LoaderCircle size={20} className="animate-spin text-text-tertiary" aria-label="Agregando…" />}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
