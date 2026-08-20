import { dispatchCanonicalChat } from './canonical-client'
import type { GatewayContext, GatewayDispatchResult } from './types'

export async function dispatchTrustedGateway(
  context: GatewayContext,
): Promise<GatewayDispatchResult> {
  return dispatchCanonicalChat(context)
}
