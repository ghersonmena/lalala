import { useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { deletePlaylist, invalidatePlaylists, renamePlaylist } from '../../core/data/playlists'
import type { Playlist } from '../../core/model/library'
import { PrimaryButton, TextField } from '../../core/ui/forms'
import { Modal } from '../../core/ui/Modal'
import { showToast } from '../../core/ui/Toast'

type Step = 'menu' | 'rename' | 'delete'

/** Hoja de opciones de una playlist: renombrar y borrar (con confirmación). */
export function PlaylistOptions({ playlist, open, onClose }: { playlist: Playlist; open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="playlist-options-title">
      {/* Se monta de nuevo en cada apertura: empieza en el menú */}
      {open && <Content playlist={playlist} onClose={onClose} />}
    </Modal>
  )
}

function Content({ playlist, onClose }: { playlist: Playlist; onClose: () => void }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('menu')
  const [name, setName] = useState(playlist.name)
  const [busy, setBusy] = useState(false)

  const rename = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || trimmed === playlist.name) return onClose()
    setBusy(true)
    try {
      await renamePlaylist(playlist.id, trimmed)
      invalidatePlaylists(queryClient, playlist.id)
      showToast('Playlist renombrada')
      onClose()
    } catch {
      showToast('No se pudo renombrar la playlist')
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await deletePlaylist(playlist.id)
      onClose()
      void queryClient.invalidateQueries({ queryKey: ['playlists'] })
      void navigate('/library/playlists', { replace: true, viewTransition: true })
      showToast(`Playlist "${playlist.name}" borrada`)
    } catch {
      showToast('Jellyfin no permitió borrar la playlist')
      setBusy(false)
    }
  }

  return (
    <div className="px-5 pt-5 pb-[max(env(safe-area-inset-bottom),16px)]">
      <h2 id="playlist-options-title" className="truncate font-display text-[1.3125rem] font-extrabold">
        {step === 'rename' ? 'Renombrar playlist' : step === 'delete' ? '¿Borrar la playlist?' : playlist.name}
      </h2>

      {step === 'menu' && (
        <ul className="mt-3 border-t border-divider">
          <Row icon={<Pencil size={22} aria-hidden />} label="Renombrar" onClick={() => setStep('rename')} />
          <Row icon={<Trash2 size={22} aria-hidden />} label="Borrar playlist" onClick={() => setStep('delete')} danger />
        </ul>
      )}

      {step === 'rename' && (
        <form onSubmit={(e) => void rename(e)} className="mt-4 flex flex-col gap-3">
          <TextField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoFocus enterKeyHint="done" />
          <PrimaryButton type="submit" loading={busy} disabled={!name.trim()}>
            Guardar
          </PrimaryButton>
        </form>
      )}

      {step === 'delete' && (
        <div className="mt-2 flex flex-col gap-3">
          <p className="text-text-secondary">
            Se borrará “{playlist.name}” de tu servidor Jellyfin. Las canciones no se borran.
          </p>
          <PrimaryButton type="button" loading={busy} onClick={() => void remove()} className="!bg-[#D92D20]">
            Borrar
          </PrimaryButton>
          <button type="button" onClick={onClose} className="h-12 font-medium text-accent">
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}

function Row({ icon, label, onClick, danger }: { icon: ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <li className="border-b border-divider last:border-b-0">
      <button type="button" onClick={onClick} className="flex min-h-14 w-full items-center gap-4 text-left active:opacity-60">
        <span className={danger ? 'text-[#E5484D]' : 'text-accent'}>{icon}</span>
        <span className={`text-base ${danger ? 'text-[#E5484D]' : ''}`}>{label}</span>
      </button>
    </li>
  )
}
