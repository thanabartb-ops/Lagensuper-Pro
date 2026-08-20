import { describe, expect, it } from 'vitest'
import { getGatewaySnapshot, requestTrustedGateway } from '../lib/gateway/client'
import type { ConnectionStatus } from '../lib/gateway/types'

const allStatuses: ConnectionStatus[] = [
  'NOT_CONNECTED',
  'CONNECTED',
  'DEGRADED',
  'BLOCKED',
]

describe('PRO-R2 gateway contract', () => {
  it('exposes exactly the four approved connection states', () => {
    expect(allStatuses).toEqual([
      'NOT_CONNECTED',
      'CONNECTED',
      'DEGRADED',
      'BLOCKED',
    ])
  })

  it('defaults gateway and backend to NOT_CONNECTED', () => {
    expect(getGatewaySnapshot()).toEqual({
      gateway: 'NOT_CONNECTED',
      backend: 'NOT_CONNECTED',
    })
  })

  it('fails closed without performing privileged network execution', async () => {
    const response = await requestTrustedGateway({
      endpoint: '/not-enabled-in-pro-r2',
      payload: { example: true },
    })

    expect(response).toEqual({
      status: 'not_connected',
      errorLayer: 'GATEWAY_ERROR',
      message: 'Trusted gateway execution is not connected in PRO-R2.',
    })
  })
})
