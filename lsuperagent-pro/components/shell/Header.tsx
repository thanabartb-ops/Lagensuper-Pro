import { StatusBadge } from '@/components/common/StatusBadge'
import { getGatewaySnapshot } from '@/lib/gateway/client'

export function Header() {
  const { gateway } = getGatewaySnapshot()

  return (
    <header className="flex min-h-16 items-center justify-between gap-4 border-b border-zinc-800 bg-black/70 px-4 sm:px-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Alternate Client</p>
        <p className="font-semibold tracking-tight text-white">LSUPERAGENT PRO</p>
      </div>
      <StatusBadge status={gateway} />
    </header>
  )
}
