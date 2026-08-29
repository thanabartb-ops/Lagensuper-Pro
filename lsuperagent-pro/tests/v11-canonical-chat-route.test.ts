// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { POST } from '../app/api/chat/route'

const userToken = 'supabase-user-jwt-test-only'

function enableGateway() {
  process.env.LSUPERAGENT_GATEWAY_URL = 'https://gateway.example.test'
  process.env.LSUPERAGENT_GATEWAY_CLIENT_ID = 'lsuperagent-pro'
  process.env.LSUPERAGENT_GATEWAY_HMAC_SECRET = 'v11-canonical-test-secret'
}

afterEach(() => {
  delete process.env.LSUPERAGENT_GATEWAY_URL
  delete process.env.LSUPERAGENT_GATEWAY_CLIENT_ID
  delete process.env.LSUPERAGENT_GATEWAY_HMAC_SECRET
  delete process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  vi.unstubAllGlobals()
})

describe('V11 canonical /api/chat boundary', () => {
  it('fails closed with 401 before network access when user auth is missing', async () => {
    enableGateway()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const response = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: 'hello' }),
      }),
    )

    expect(response.status).toBe(401)
    expect(await response.json()).toMatchObject({ code: 'UNAUTHENTICATED' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects malformed chat payloads without contacting the gateway', async () => {
    enableGateway()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const response = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ message: '', unexpected: true }),
      }),
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ code: 'INVALID_REQUEST' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('accepts a verified provider-neutral execution and does not leak the user token', async () => {
    enableGateway()
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      expect(headers.get('authorization')).toBe(`Bearer ${userToken}`)
      expect(String(init?.body)).not.toContain(userToken)

      const signedBody = JSON.parse(String(init?.body)) as { requestId: string }
      return Response.json(
        {
          requestId: signedBody.requestId,
          status: 'verified',
          gateway: 'CONNECTED',
          backend: 'CONNECTED',
          provider: 'gemini',
          data: {
            status: 'EXECUTED',
            runtime_version: '2026.08.30.1',
            provider: 'gemini',
            model: 'gemini-runtime-test',
            output: { text: 'verified provider-neutral response' },
            evidence: {
              provider_request_id: 'provider-request-1',
              correlation_id: 'corr-1',
              qa_run_id: 'qa-1',
            },
          },
        },
        { status: 200 },
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const response = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ message: 'Use the canonical runtime.' }),
      }),
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload).toMatchObject({
      status: 'verified',
      data: {
        status: 'EXECUTED',
        provider: 'gemini',
        model: 'gemini-runtime-test',
      },
    })
    expect(JSON.stringify(payload)).not.toContain(userToken)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('rejects a forged verified response when top-level and data providers disagree', async () => {
    enableGateway()
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const signedBody = JSON.parse(String(init?.body)) as { requestId: string }
      return Response.json(
        {
          requestId: signedBody.requestId,
          status: 'verified',
          gateway: 'CONNECTED',
          backend: 'CONNECTED',
          provider: 'gemini',
          data: {
            status: 'EXECUTED',
            runtime_version: '2026.08.30.1',
            provider: 'other-provider',
            model: 'mismatch-test',
            evidence: {
              provider_request_id: 'provider-request-2',
              correlation_id: 'corr-2',
              qa_run_id: 'qa-2',
            },
          },
        },
        { status: 200 },
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const response = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ message: 'reject mismatch' }),
      }),
    )

    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({ code: 'UPSTREAM_UNAVAILABLE' })
  })
})
