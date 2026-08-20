import { createR3SignedRequest } from './r3-signing'
import type { GatewayContext, GatewayDispatchResult } from './types'

type DispatchOptions = {
  gatewayUrl?: string
  clientId?: string
  secret?: string
  fetchImpl?: typeof fetch
  nowSeconds?: number
  nonce?: string
  timeoutMs?: number
}

function isCanonicalHandshake(
  input: unknown,
  requestId: string,
): input is {
  requestId: string
  status: 'failed'
  code: 'UPSTREAM_UNAVAILABLE'
  gateway: 'CONNECTED'
  backend: 'NOT_CONNECTED'
} {
  if (input === null || Array.isArray(input) || typeof input !== 'object') {
    return false
  }

  const record = input as Record<string, unknown>
  return (
    record.requestId === requestId &&
    record.status === 'failed' &&
    record.code === 'UPSTREAM_UNAVAILABLE' &&
    record.gateway === 'CONNECTED' &&
    record.backend === 'NOT_CONNECTED'
  )
}

export async function dispatchTrustedGateway(
  context: GatewayContext,
  options: DispatchOptions = {},
): Promise<GatewayDispatchResult> {
  const gatewayUrl = options.gatewayUrl ?? process.env.LSUPERAGENT_GATEWAY_URL ?? ''
  const clientId =
    options.clientId ?? process.env.LSUPERAGENT_GATEWAY_CLIENT_ID ?? ''
  const secret =
    options.secret ?? process.env.LSUPERAGENT_GATEWAY_HMAC_SECRET ?? ''

  if (!gatewayUrl || clientId !== 'lsuperagent-pro' || !secret) {
    return { status: 'not_connected', requestId: context.requestId }
  }

  let endpoint: string
  try {
    const base = new URL(gatewayUrl)
    if (base.protocol !== 'https:' && base.protocol !== 'http:') {
      return { status: 'not_connected', requestId: context.requestId }
    }
    endpoint = new URL('/api/chat', base).toString()
  } catch {
    return { status: 'not_connected', requestId: context.requestId }
  }

  const signed = createR3SignedRequest(context, {
    clientId,
    secret,
    timestamp: options.nowSeconds,
    nonce: options.nonce,
  })
  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 5000,
  )

  try {
    const response = await (options.fetchImpl ?? fetch)(endpoint, {
      method: 'POST',
      headers: signed.headers,
      body: signed.body,
      signal: controller.signal,
    })

    if (response.status !== 503) {
      return { status: 'not_connected', requestId: context.requestId }
    }

    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      return { status: 'not_connected', requestId: context.requestId }
    }

    if (!isCanonicalHandshake(payload, context.requestId)) {
      return { status: 'not_connected', requestId: context.requestId }
    }

    return {
      status: 'gateway_connected',
      requestId: context.requestId,
      backend: 'not_connected',
    }
  } catch {
    return { status: 'not_connected', requestId: context.requestId }
  } finally {
    clearTimeout(timeout)
  }
}
