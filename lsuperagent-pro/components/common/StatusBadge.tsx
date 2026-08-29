import clsx from 'clsx'
import type { ConnectionStatus } from '@/lib/gateway/types'

const styles: Record<ConnectionStatus, string> = {
  NOT_CONNECTED: 'border-zinc-700 bg-zinc-900 text-zinc-300',
  CONNECTED: 'border-emerald-700/60 bg-emerald-950/40 text-emerald-300',
  DEGRADED: 'border-amber-700/60 bg-amber-950/40 text-amber-300',
  BLOCKED: 'border-rose-700/60 bg-rose-950/40 text-rose-300',
}

export function StatusBadge({ status }: { status: ConnectionStatus }) {
  return (
    <span
      className={clsx(
        'inline-flex rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide',
        styles[status],
      )}
    >
      {status}
    </span>
  )
}
