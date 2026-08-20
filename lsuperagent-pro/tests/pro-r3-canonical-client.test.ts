import { describe, expect, it, vi } from 'vitest'
import {
  createCanonicalSignature,
  dispatchCanonicalChat,
} from '../lib/gateway/canonical-client'
import type { GatewayContext } from '../lib/gateway/types'

const context: GatewayContext = {
  requestId: '11111111-1111-4111-8111-111111111111',
  userId: null,
  workspaceId: 'w1',
  action: 'chat',
  input: { message: 'hello' },
  receivedAt: '2026-08-21T00:00:00.000Z',
}

const fixture = {
  secret: 'unit-test-secret-only',
  timestamp: 1787263200,
  requestId: context.requestId,
  body: JSON.stringify({ message: 'hello', workspaceId: 'w1' }),
}

describe('PRO-R3 canonical gateway client', () => {
  it('matches the canonical HMAC v1 test vector', () => {
    expect(createCanonicalSignature(fixture)).toBe(
      'v1=99d54f595668b58ed5bf558f67f3687690d750d238ddaf08b37966e0e217f93f',
    )
  })

  it('fails closed without network when server configuration is absent', async () => {
    const fetchImpl = vi.fn()

    await expect(
      dispatchCanonicalChat(context, {
        gatewayUrl: '',
        secret: '',
        fetchImpl,
        nowSeconds: fixture.timestamp,
      }),
    ).resolves.toEqual({
      status: 'not_connected',
      requestId: context.requestId,
    })

    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('maps a valid canonical handshake to gateway_connected without execution', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          requestId: context.requestId,
          gateway: 'CONNECTED',
          execution: 'NOT_CONNECTED',
          code: 'UPSTREAM_UNAVAILABLE',
        }),
        {
          status: 503,
          headers: { 'content-type': 'application/json' },
        },
      ),
    )

    await expect(
      dispatchCanonicalChat(context, {
        gatewayUrl: 'https://gateway.example.test',
        secret: fixture.secret,
        fetchImpl,
        nowSeconds: fixture.timestamp,
      }),
    ).resolves.toEqual({
      status: 'gateway_connected',
      requestId: context.requestId,
      execution: 'not_connected',
    })

    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('https://gateway.example.test/api/chat')
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe(fixture.body)
    expect(init?.headers).toMatchObject({
      'content-type': 'application/json',
      'x-lsuperagent-client': 'lsuperagent-pro',
      'x-lsuperagent-timestamp': String(fixture.timestamp),
      'x-lsuperagent-request-id': context.requestId,
      'x-lsuperagent-signature':
        'v1=99d54f595668b58ed5bf558f67f3687690d750d238ddaf08b37966e0e217f93f',
    })
  })

  it('fails closed on network failure or malformed canonical response', async () => {
    const throwingFetch = vi.fn(async () => {
      throw new Error('network unavailable')
    })

    await expect(
      dispatchCanonicalChat(context, {
        gatewayUrl: 'https://gateway.example.test',
        secret: fixture.secret,
        fetchImpl: throwingFetch,
        nowSeconds: fixture.timestamp,
      }),
    ).resolves.toEqual({
      status: 'not_connected',
      requestId: context.requestId,
    })

    const malformedFetch = vi.fn(async () =>
      new Response(JSON.stringify({ gateway: 'CONNECTED' }), { status: 503 }),
    )

    await expect(
      dispatchCanonicalChat(context, {
        gatewayUrl: 'https://gateway.example.test',
        secret: fixture.secret,
        fetchImpl: malformedFetch,
        nowSeconds: fixture.timestamp,
      }),
    ).resolves.toEqual({
      status: 'not_connected',
      requestId: context.requestId,
    })
  })
})
