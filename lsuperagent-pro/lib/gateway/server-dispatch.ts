import type { GatewayContext, GatewayDispatchResult } from './types'

export async function dispatchTrustedGateway(
  context: GatewayContext,
): Promise<GatewayDispatchResult> {
  return {
    status: 'not_connected',
    requestId: context.requestId,
  }
}
