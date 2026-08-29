import { randomUUID } from 'node:crypto'

export async function GET() {
  return Response.json({
    app: 'ok',
    client: 'LSUPERAGENT_PRO',
    role: 'ALTERNATE_CLIENT',
    gateway: 'NOT_CONNECTED',
    backend: 'NOT_CONNECTED',
    requestId: randomUUID(),
    timestamp: new Date().toISOString(),
  })
}
