import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { AppShell } from '../components/shell/AppShell'

const expectedPrimaryActions = [
  'หน้าหลัก',
  'แชท',
  'โปรเจกต์ & เครื่องมือ',
  'ความจำ',
  'ตั้งค่า',
] as const

afterEach(() => cleanup())

describe('V11 application shell', () => {
  it('renders V11 identity, honest status, and primary navigation', () => {
    render(
      <AppShell>
        <p>Route content</p>
      </AppShell>,
    )

    expect(screen.getAllByText('LSUPERAGENT').length).toBeGreaterThan(0)
    expect(screen.getAllByText('NOT_CONNECTED').length).toBeGreaterThan(0)

    for (const label of expectedPrimaryActions) {
      expect(screen.getAllByRole('button', { name: label }).length).toBeGreaterThan(0)
    }
  })
})
