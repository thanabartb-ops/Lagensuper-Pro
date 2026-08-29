import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { StatusBadge } from '../components/common/StatusBadge'
import type { ConnectionStatus } from '../lib/gateway/types'

const statuses: ConnectionStatus[] = [
  'NOT_CONNECTED',
  'CONNECTED',
  'DEGRADED',
  'BLOCKED',
]

afterEach(() => cleanup())

describe('PRO-R2 StatusBadge', () => {
  it.each(statuses)('renders %s', (status) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(status)).toBeInTheDocument()
  })
})
