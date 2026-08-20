import { randomUUID } from 'node:crypto'
import { parseChatRequest } from '@/lib/gateway/chat-request'
import { buildGatewayContext } from '@/lib/gateway/context'
import { dispatchTrustedGateway } from '@/lib/gateway/server-dispatch'

export async function POST(request: Request): Promise<Response> {
  const requestId = randomUUID()

  let input: unknown
  try {
    input = await request.json()
  } catch {
    return Response.json(
      { code: 'INVALID_REQUEST', requestId },
      { status: 400 },
    )
  }

  try {
    const chatRequest = parseChatRequest(input)
    const context = buildGatewayContext(chatRequest, requestId)
    const result = await dispatchTrustedGateway(context)

    if (result.status === 'not_connected') {
      return Response.json(
        { code: 'UPSTREAM_UNAVAILABLE', requestId: result.requestId },
        { status: 503 },
      )
    }

    if (result.status === 'gateway_connected') {
      return Response.json(
        {
          code: 'UPSTREAM_UNAVAILABLE',
          requestId: result.requestId,
          gateway: 'CONNECTED',
          backend: 'NOT_CONNECTED',
        },
        { status: 503 },
      )
    }

    return Response.json(
      { code: 'INTERNAL_ERROR', requestId },
      { status: 500 },
    )
  } catch {
    return Response.json(
      { code: 'INVALID_REQUEST', requestId },
      { status: 400 },
    )
  }
}
