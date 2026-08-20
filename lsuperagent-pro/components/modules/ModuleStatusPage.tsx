import { Card } from '@/components/common/Card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { getGatewaySnapshot } from '@/lib/gateway/client'

export function ModuleStatusPage({
  title,
  description,
}: {
  title: string
  description: string
}) {
  const { gateway } = getGatewaySnapshot()

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">LSUPERAGENT PRO</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{description}</p>
      </div>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Trusted gateway</p>
            <p className="mt-1 text-sm text-zinc-500">Live canonical data is unavailable in PRO-R2.</p>
          </div>
          <StatusBadge status={gateway} />
        </div>
      </Card>
    </div>
  )
}
