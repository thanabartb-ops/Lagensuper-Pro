import type { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

export function Card({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={twMerge(
        'rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5',
        className,
      )}
    >
      {children}
    </section>
  )
}
