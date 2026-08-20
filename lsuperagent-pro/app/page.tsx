import { Card } from '@/components/common/Card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { getGatewaySnapshot } from '@/lib/gateway/client'

export default function Home() {
  const snapshot = getGatewaySnapshot()

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Alternate Client</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">LSUPERAGENT PRO</h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          Thin client for the existing trusted LSUPERAGENT gateway. No parallel core, memory, audit, or runtime authority is created here.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-zinc-500">Trusted gateway</p>
          <div className="mt-3"><StatusBadge status={snapshot.gateway} /></div>
        </Card>
        <Card>
          <p className="text-sm text-zinc-500">Canonical backend</p>
          <div className="mt-3"><StatusBadge status={snapshot.backend} /></div>
        </Card>
      </div>
    </div>
  )
}
