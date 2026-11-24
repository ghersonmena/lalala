import { useQueryClient } from '@tanstack/react-query'
import { Disc3, Heart, ListEnd, ListMinus, ListPlus, ListStart } from 'lucide-react'
import type { ReactNode } from 'react'
import { create } from 'zustand'
import { useIsFavorite, useToggleFavorite } from '../../core/data/favorites'
import { invalidatePlaylists, removeFromPlaylist } from '../../core/data/playlists'
import type { Track } from '../../core/model/library'
import { Cover } from '../../core/ui/Cover'
import { Modal } from '../../core/ui/Modal'
import { showToast } from '../../core/ui/Toast'
import { addToQueue, playNext, type PlaySource } from '../../playback'
import { openAddToPlaylist } from '../library/AddToPlaylist'
import { favoriteFeedback } from './favoriteFeedback'
import { usePlayerSheet } from './usePlayerSheet'

interface TrackActionsState {
  track: Track | null
  source: PlaySource | null
}

const useTrackActionsStore = create<TrackActionsState>()(() => ({ track: null, source: null }))

/** Abre el menú "⋯" de una canción. */
export function openTrackActions(track: Track, source: PlaySource) {
  useTrackActionsStore.setState({ track, source })
}

const close = () => useTrackActionsStore.setState({ track: null, source: null })

/** Hoja de acciones de una canción: a continuación, a la cola, a una playlist, favorito e ir al álbum. */
export function TrackActionsSheet() {
  const { track, source } = useTrackActionsStore()
  // Si el menú se abrió desde el reproductor completo, "Ir al álbum" también lo cierra.
  const { closeAndGo } = usePlayerSheet()
  const queryClient = useQueryClient()
  const favorite = useIsFavorite(track)
  const toggleFavorite = useToggleFavorite()

  return (
    <Modal open={!!track} onClose={close} labelledBy="track-actions-title">
      {track && source && (
        <div className="px-5 pt-5 pb-[max(env(safe-area-inset-bottom),16px)]">
          <div className="flex items-center gap-3 pb-3">
            <Cover image={track.image} size={48} className="w-12 rounded-md" />
            <div className="min-w-0">
              <p id="track-actions-title" className="truncate font-medium">
                {track.name}
              </p>
              <p className="truncate text-[0.8125rem] text-text-secondary">{track.artistName}</p>
            </div>
          </div>
          <ul className="border-t border-divider">
            <Action
              icon={<ListStart size={22} aria-hidden />}
              label="Reproducir a continuación"
              onClick={() => {
                playNext([track], source)
                showToast('Se reproducirá a continuación')
                close()
              }}
            />
            <Action
              icon={<ListEnd size={22} aria-hidden />}
              label="Agregar a la cola"
              onClick={() => {
                addToQueue([track], source)
                showToast('Agregada a la cola')
                close()
              }}
            />
            <Action
              icon={<ListPlus size={22} aria-hidden />}
              label="Agregar a una playlist"
              onClick={() => {
                close()
                openAddToPlaylist([track])
              }}
            />
            <Action
              icon={<Heart size={22} fill={favorite ? 'currentColor' : 'none'} aria-hidden />}
              label={favorite ? 'Quitar de favoritas' : 'Agregar a favoritas'}
              onClick={() => {
                void toggleFavorite(track, favorite).then((r) => favoriteFeedback(r, true))
                close()
              }}
            />
            {source.type === 'playlist' && source.id && track.playlistItemId && (
              <Action
                icon={<ListMinus size={22} aria-hidden />}
                label="Quitar de esta playlist"
                onClick={() => {
                  const playlistId = source.id as string
                  close()
                  removeFromPlaylist(playlistId, [track.playlistItemId as string])
                    .then(() => {
                      invalidatePlaylists(queryClient, playlistId)
                      showToast(`Quitada de ${source.name}`)
                    })
                    .catch(() => showToast('No se pudo quitar de la playlist'))
                }}
              />
            )}
            {track.albumId && (
              <Action
                icon={<Disc3 size={22} aria-hidden />}
                label="Ir al álbum"
                onClick={() => {
                  close()
                  closeAndGo(`/album/${track.albumId}`)
                }}
              />
            )}
          </ul>
        </div>
      )}
    </Modal>
  )
}

function Action({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <li className="border-b border-divider last:border-b-0">
      <button type="button" onClick={onClick} className="flex min-h-14 w-full items-center gap-4 text-left active:opacity-60">
        <span className="text-accent">{icon}</span>
        <span className="text-base">{label}</span>
      </button>
    </li>
  )
}
