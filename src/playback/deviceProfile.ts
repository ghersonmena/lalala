import type { DeviceProfile, DirectPlayProfile } from '@jellyfin/sdk/lib/generated-client/models'
import { APP_NAME } from '../core/config'

// Formatos candidatos: contenedor(es) + códec para Jellyfin, y el MIME para preguntar al navegador.
const CANDIDATES: { container: string; codec: string; mime: string }[] = [
  { container: 'mp3', codec: 'mp3', mime: 'audio/mpeg' },
  { container: 'flac', codec: 'flac', mime: 'audio/flac' },
  { container: 'm4a,mp4', codec: 'aac', mime: 'audio/mp4; codecs="mp4a.40.2"' },
  { container: 'm4a,mp4', codec: 'alac', mime: 'audio/mp4; codecs="alac"' },
  { container: 'aac', codec: 'aac', mime: 'audio/aac' },
  { container: 'ogg', codec: 'opus', mime: 'audio/ogg; codecs="opus"' },
  { container: 'webm,webma', codec: 'opus', mime: 'audio/webm; codecs="opus"' },
  { container: 'ogg', codec: 'vorbis', mime: 'audio/ogg; codecs="vorbis"' },
  { container: 'wav', codec: 'pcm_s16le,pcm_s24le', mime: 'audio/wav' },
]

/** true si el navegador reproduce HLS sin hls.js (Safari/iOS). */
export function supportsNativeHls(audio: HTMLMediaElement = document.createElement('audio')): boolean {
  return audio.canPlayType('application/vnd.apple.mpegurl') !== ''
}

/**
 * Perfil para PlaybackInfo: le dice a Jellyfin qué puede reproducir este navegador tal cual
 * (direct play) y que, si no, convierta a AAC por HLS.
 */
export function buildDeviceProfile(maxBitrate: number): DeviceProfile {
  const audio = document.createElement('audio')
  const direct: DirectPlayProfile[] = CANDIDATES.filter((c) => audio.canPlayType(c.mime) !== '').map((c) => ({
    Container: c.container,
    AudioCodec: c.codec,
    Type: 'Audio',
  }))

  return {
    Name: `${APP_NAME} web`,
    MaxStreamingBitrate: maxBitrate,
    MaxStaticBitrate: maxBitrate,
    MusicStreamingTranscodingBitrate: Math.min(maxBitrate, 256_000),
    DirectPlayProfiles: direct,
    TranscodingProfiles: [
      {
        Container: 'ts',
        Type: 'Audio',
        AudioCodec: 'aac',
        Context: 'Streaming',
        Protocol: 'hls',
        MaxAudioChannels: '2',
        MinSegments: 1,
        BreakOnNonKeyFrames: true,
      },
    ],
    ContainerProfiles: [],
    CodecProfiles: [],
    SubtitleProfiles: [],
  }
}
