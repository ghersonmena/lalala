import type { Api } from '@jellyfin/sdk'
import type { MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client/models'
import { getMediaInfoApi } from '@jellyfin/sdk/lib/utils/api/media-info-api'
import { jellyfin } from '../core/api/jellyfin'
import { AppError } from '../core/data/errors'
import { buildDeviceProfile } from './deviceProfile'

/** Calidad máxima por defecto (alta: si el navegador soporta el formato, se reproduce el original). */
export const DEFAULT_MAX_BITRATE = 140_000_000

export interface StreamInfo {
  url: string
  /** 'direct' = archivo original; 'hls' = transcodificado por Jellyfin. */
  kind: 'direct' | 'hls'
  /** Texto de la insignia del reproductor, p. ej. "FLAC · DIRECT PLAY" o "AAC 192 · TRANSCODIFICANDO". */
  badge: string
  playSessionId: string | null
  mediaSourceId: string | null
}

interface ResolveOptions {
  api: Api
  userId: string
  itemId: string
  /** Fuerza transcodificar (reintento cuando el navegador no pudo con el original). */
  forceTranscode?: boolean
  maxBitrate?: number
}

/** Pregunta a Jellyfin cómo reproducir la canción en este navegador (POST /Items/{id}/PlaybackInfo). */
export async function resolveStream({ api, userId, itemId, forceTranscode = false, maxBitrate = DEFAULT_MAX_BITRATE }: ResolveOptions): Promise<StreamInfo> {
  const { data } = await getMediaInfoApi(api).getPostedPlaybackInfo({
    itemId,
    playbackInfoDto: {
      UserId: userId,
      MaxStreamingBitrate: maxBitrate,
      DeviceProfile: buildDeviceProfile(maxBitrate),
      EnableDirectPlay: !forceTranscode,
      EnableDirectStream: !forceTranscode,
      EnableTranscoding: true,
      AutoOpenLiveStream: true,
    },
  })

  if (data.ErrorCode) {
    throw new AppError('server-error', 'Jellyfin no puede reproducir esta canción en este dispositivo.')
  }
  const source = data.MediaSources?.[0]
  if (!source) throw new AppError('server-error', 'La canción no tiene un archivo reproducible.')

  return toStreamInfo(api, userId, itemId, source, data.PlaySessionId ?? null, forceTranscode)
}

function toStreamInfo(
  api: Api,
  userId: string,
  itemId: string,
  source: MediaSourceInfo,
  playSessionId: string | null,
  forceTranscode: boolean,
): StreamInfo {
  const base = api.basePath.replace(/\/+$/, '')
  const container = (source.Container ?? '').split(',')[0]?.toUpperCase() ?? ''

  if (!forceTranscode && (source.SupportsDirectPlay || source.SupportsDirectStream) && !source.TranscodingUrl) {
    // <audio> no puede mandar headers: el token va como api_key en la URL.
    const params = new URLSearchParams({
      static: 'true',
      mediaSourceId: source.Id ?? itemId,
      deviceId: jellyfin.deviceInfo.id,
      api_key: api.accessToken,
      userId,
    })
    if (playSessionId) params.set('playSessionId', playSessionId)
    return {
      url: `${base}/Audio/${encodeURIComponent(itemId)}/stream?${params}`,
      kind: 'direct',
      badge: `${container || 'AUDIO'} · DIRECT PLAY`,
      playSessionId,
      mediaSourceId: source.Id ?? null,
    }
  }

  if (!source.TranscodingUrl) {
    throw new AppError('server-error', 'Jellyfin no ofreció una forma de reproducir esta canción.')
  }
  const url = new URL(base + source.TranscodingUrl)
  if (!url.searchParams.has('api_key') && !url.searchParams.has('ApiKey')) url.searchParams.set('api_key', api.accessToken)
  const kbps = transcodeKbps(url)
  return {
    url: url.toString(),
    kind: 'hls',
    badge: `AAC${kbps ? ` ${kbps}` : ''} · TRANSCODIFICANDO`,
    playSessionId,
    mediaSourceId: source.Id ?? null,
  }
}

/** Bitrate de audio de la URL de transcodificación (kbps), si viene. */
function transcodeKbps(url: URL): number | null {
  const raw = url.searchParams.get('AudioBitrate') ?? url.searchParams.get('audioBitRate')
  const n = raw ? Number(raw) : NaN
  return Number.isFinite(n) && n > 0 ? Math.round(n / 1000) : null
}
