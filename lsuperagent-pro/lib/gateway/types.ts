export type ConnectionStatus =
  | 'NOT_CONNECTED'
  | 'CONNECTED'
  | 'DEGRADED'
  | 'BLOCKED'

export type GatewayErrorLayer =
  | 'UI_ERROR'
  | 'AUTH_ERROR'
  | 'GATEWAY_ERROR'
  | 'POLICY_ERROR'
  | 'MEMORY_ERROR'
  | 'TOOL_ERROR'
  | 'MODEL_ERROR'
  | 'AUDIT_ERROR'
  | 'DATABASE_ERROR'

export interface TrustedGatewayRequest<TPayload = unknown> {
  endpoint: string
  payload: TPayload
  userAuthToken?: string
}

export interface TrustedGatewayResponse<T = unknown> {
  status: 'verified' | 'blocked' | 'failed' | 'not_connected'
  data?: T
  executionId?: string
  errorLayer?: GatewayErrorLayer
  message?: string
}

export interface GatewaySnapshot {
  gateway: ConnectionStatus
  backend: ConnectionStatus
}
