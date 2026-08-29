import type { ReactNode } from 'react'
import { V11Shell } from '@/components/v11/V11Shell'

export function AppShell({ children }: { children: ReactNode }) {
  return <V11Shell>{children}</V11Shell>
}
