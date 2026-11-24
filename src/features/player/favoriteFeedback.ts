import type { FavoriteResult } from '../../core/data/favorites'
import { showToast } from '../../core/ui/Toast'

/**
 * Aviso tras marcar/desmarcar una favorita. Los errores siempre se muestran; el éxito solo si
 * `announceSuccess` (en el reproductor basta la animación del corazón).
 */
export function favoriteFeedback(result: FavoriteResult, announceSuccess: boolean) {
  if (result.problem === 'request') showToast('No se pudo guardar el favorito en Jellyfin')
  else if (result.problem === 'not-saved') showToast('Jellyfin respondió, pero no guardó el favorito')
  else if (announceSuccess) showToast(result.favorite ? 'Agregada a favoritas' : 'Quitada de favoritas')
}
