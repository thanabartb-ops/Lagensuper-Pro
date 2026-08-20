import { createHash, createHmac } from 'node:crypto'
import type { GatewayContext } from './types'

type CanonicalDispatchResult =
  | { status: 'not_connected'; requestId: string }
  | {
      status: 'gateway_connected'
      requestId: string
      execution: 'not_connected'
    }

type CanonicalClientOptions = {
  gatewayUrl?: string
  secret?: string
  fetchImpl?: typeof fetch
  nowSeconds?: number
  timeoutMs?: number
}

export function createCanonicalSignature(input: {
  secret: string
  timestamp: number
  requestId: string
  body: string
}): string {
  const bodyHash = createHash('sha256').update(input.body).digest('hex')
  const signingInput = `v1\n${input.timestamp}\n${input.requestId}\n${bodyHash}`
  return `v1=${createHmac('sha256', input.secret).update(signingInput).digest('hex')}`
}

function isCanonicalHandshake(
  input: unknown,
  requestId: string,
): input is {
  requestId: string
  gateway: 'CONNECTED'
  execution: 'NOT_CONNECTED'
  code: 'UPSTREAM_UNAVAILABLE'
} {
  if (input === null || Array.isArray(input) || typeof input !== 'object') {
    return false
  }

  const record = input as Record<string, unknown>
  return (
    record.requestId === requestId &&
    record.gateway === 'CONNECTED' &&
    record.execution === 'NOT_CONNECTED' &&
    record.code === 'UPSTREAM_UNAVAILABLE'
  )
}

export async function dispatchCanonicalChat(
  context: GatewayContext,
  options: CanonicalClientOptions = {},
): Promise<CanonicalDispatchResult> {
  const gatewayUrl =
    options.gatewayUrl ?? process.env.LSUPERAGENT_GATEWAY_URL ?? ''
  const secret =
    options.secret ?? process.env.LSUPERAGENT_GATEWAY_SHARED_SECRET ?? ''

  if (!gatewayUrl || !secret) {
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

  const timestamp = options.nowSeconds ?? Math.floor(Date.now() / 1000)
  const body = JSON.stringify({
    message: context.input.message,
    workspaceId: context.workspaceId,
  })
  const signature = createCanonicalSignature({
    secret,
    timestamp,
    requestId: context.requestId,
    body,
  })

  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 5000,
  )

  try {
    const response = await (options.fetchImpl ?? fetch)(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-lsuperagent-client': 'lsuperagent-pro',
        'x-lsuperagent-timestamp': String(timestamp),
        'x-lsuperagent-request-id': context.requestId,
        'x-lsuperagent-signature': signature,
      },
      body,
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
      execution: 'not_connected',
    }
  } catch {
    return { status: 'not_connected', requestId: context.requestId }
  } finally {
    clearTimeout(timeout)
  }
}
