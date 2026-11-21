import {
  ProductNameIssue,
  RecommendedServerInfoScore,
  SystemInfoIssue,
  VersionUnsupportedIssue,
  type RecommendedServerInfo,
} from '@jellyfin/sdk'
import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import { pickServer, toLoginError } from './authRepository'

const server = (over: Partial<RecommendedServerInfo>): RecommendedServerInfo => ({
  address: 'https://jellyfin.example.com/',
  responseTime: 50,
  score: RecommendedServerInfoScore.GREAT,
  issues: [],
  systemInfo: { Id: 'abc', ServerName: 'Casa', Version: '10.11.0', ProductName: 'Jellyfin Server' },
  ...over,
})

const httpError = (status?: number) => {
  const config = { headers: new AxiosHeaders() }
  return new AxiosError(
    'error',
    status ? 'ERR_BAD_REQUEST' : 'ERR_NETWORK',
    config,
    undefined,
    status ? { status, statusText: '', data: null, headers: {}, config } : undefined,
  )
}

describe('pickServer', () => {
  it('devuelve el servidor válido con la URL sin "/" final', () => {
    expect(pickServer([server({})])).toEqual({
      url: 'https://jellyfin.example.com',
      id: 'abc',
      name: 'Casa',
      version: '10.11.0',
    })
  })

  it('ignora candidatos inaccesibles y elige el que responde', () => {
    const bad = server({
      address: 'https://jellyfin.example.com:8096/',
      score: RecommendedServerInfoScore.BAD,
      issues: [new SystemInfoIssue()],
      systemInfo: undefined,
    })
    expect(pickServer([bad, server({})]).url).toBe('https://jellyfin.example.com')
  })

  it('avisa cuando la dirección responde pero no es Jellyfin', () => {
    const notJellyfin = server({ score: RecommendedServerInfoScore.BAD, issues: [new ProductNameIssue('Nginx')] })
    expect(() => pickServer([notJellyfin])).toThrow(expect.objectContaining({ code: 'not-jellyfin' }))
  })

  it('avisa cuando ningún candidato responde', () => {
    const down = server({ score: RecommendedServerInfoScore.BAD, issues: [new SystemInfoIssue()], systemInfo: undefined })
    expect(() => pickServer([down])).toThrow(expect.objectContaining({ code: 'unreachable' }))
  })

  it('rechaza versiones de Jellyfin no soportadas', () => {
    const old = server({ score: RecommendedServerInfoScore.OK, issues: [new VersionUnsupportedIssue('10.8.13')] })
    expect(() => pickServer([old])).toThrow(expect.objectContaining({ code: 'unsupported-version' }))
  })
})

describe('toLoginError', () => {
  it('401 = credenciales incorrectas', () => {
    expect(toLoginError(httpError(401)).code).toBe('invalid-credentials')
  })

  it('sin respuesta = servidor inaccesible', () => {
    expect(toLoginError(httpError()).code).toBe('unreachable')
  })

  it('500 = error del servidor', () => {
    expect(toLoginError(httpError(500)).code).toBe('server-error')
  })
})
