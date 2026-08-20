import { afterEach, describe, expect, it, vi } from 'vitest'
import { POST } from '../app/api/chat/route'
import { dispatchTrustedGateway } from '../lib/gateway/server-dispatch'
import type { GatewayContext } from '../lib/gateway/types'

function chatRequest(body: string) {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  })
}

function canonicalFetch() {
  return vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    const headers = init?.headers as Record<string, string>
    const requestId = headers['x-lsuperagent-request-id']

    return new Response(
      JSON.stringify({
        requestId,
        gateway: 'CONNECTED',
        execution: 'NOT_CONNECTED',
        code: 'UPSTREAM_UNAVAILABLE',
      }),
      { status: 503, headers: { 'content-type': 'application/json' } },
    )
  })
}

function enableCanonicalGateway() {
  vi.stubEnv('LSUPERAGENT_GATEWAY_URL', 'https://gateway.example.test')
  vi.stubEnv('LSUPERAGENT_GATEWAY_SHARED_SECRET', 'unit-test-secret-only')
  vi.stubGlobal('fetch', canonicalFetch())
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('PRO-R3 fail-closed chat route', () => {
  it('returns 503 UPSTREAM_UNAVAILABLE for a valid request without gateway config', async () => {
    const response = await POST(
      chatRequest(JSON.stringify({ message: 'hello', workspaceId: 'w1' })),
    )
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.code).toBe('UPSTREAM_UNAVAILABLE')
    expect(typeof body.requestId).toBe('string')
    expect(body.requestId.length).toBeGreaterThan(0)
  })

  it('returns 400 INVALID_REQUEST for malformed JSON', async () => {
    const response = await POST(chatRequest('{not-json'))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.code).toBe('INVALID_REQUEST')
    expect(typeof body.requestId).toBe('string')
  })

  it('returns 400 for invalid or unknown request fields', async () => {
    const response = await POST(
      chatRequest(JSON.stringify({ message: 'hello', provider: 'browser-selected' })),
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.code).toBe('INVALID_REQUEST')
  })

  it('does not expose internal or privileged material in public responses', async () => {
    const response = await POST(chatRequest(JSON.stringify({ message: 'hello' })))
    const text = await response.text()
    const forbidden = [
      'stack',
      'authorization',
      'SUPABASE_' + 'SERVICE_ROLE_KEY',
      'OPENAI_' + 'API_KEY',
      'ANTHROPIC_' + 'API_KEY',
      'GEMINI_' + 'API_KEY',
    ]

    for (const marker of forbidden) {
      expect(text.toLowerCase()).not.toContain(marker.toLowerCase())
    }
  })

  it('keeps the server dispatcher fail-closed when gateway config is absent', async () => {
    const context: GatewayContext = {
      requestId: 'request-1',
      userId: null,
      workspaceId: null,
      action: 'chat',
      input: { message: 'hello' },
      receivedAt: new Date().toISOString(),
    }

    await expect(dispatchTrustedGateway(context)).resolves.toEqual({
      status: 'not_connected',
      requestId: 'request-1',
    })
  })

  it('delegates to the canonical gateway and preserves execution as not connected', async () => {
    enableCanonicalGateway()

    const context: GatewayContext = {
      requestId: '11111111-1111-4111-8111-111111111111',
      userId: null,
      workspaceId: 'w1',
      action: 'chat',
      input: { message: 'hello' },
      receivedAt: new Date().toISOString(),
    }

    await expect(dispatchTrustedGateway(context)).resolves.toEqual({
      status: 'gateway_connected',
      requestId: context.requestId,
      execution: 'not_connected',
    })
  })

  it('reports canonical gateway connectivity without claiming model execution', async () => {
    enableCanonicalGateway()

    const response = await POST(
      chatRequest(JSON.stringify({ message: 'hello', workspaceId: 'w1' })),
    )
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toMatchObject({
      code: 'UPSTREAM_UNAVAILABLE',
      gateway: 'CONNECTED',
      execution: 'NOT_CONNECTED',
    })
    expect(typeof body.requestId).toBe('string')
  })
})
