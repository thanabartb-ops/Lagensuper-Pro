import type {
  GatewaySnapshot,
  TrustedGatewayRequest,
  TrustedGatewayResponse,
} from './types'

export function getGatewaySnapshot(): GatewaySnapshot {
  return {
    gateway: 'NOT_CONNECTED',
    backend: 'NOT_CONNECTED',
  }
}

export async function requestTrustedGateway<T = unknown>(
  _request: TrustedGatewayRequest,
): Promise<TrustedGatewayResponse<T>> {
  void _request
  return {
    status: 'not_connected',
    errorLayer: 'GATEWAY_ERROR',
    message: 'Trusted gateway execution is not connected in PRO-R2.',
  }
}
