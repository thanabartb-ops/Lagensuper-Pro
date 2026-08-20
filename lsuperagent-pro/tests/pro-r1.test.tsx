import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Home from '../app/page'

afterEach(() => cleanup())

describe('LSUPERAGENT PRO R1 contract', () => {
  it('renders alternate-client identity with disconnected status', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { name: /LSUPERAGENT PRO/i })).toBeInTheDocument()
    expect(screen.getByText('Alternate Client')).toBeInTheDocument()
    expect(screen.getByText('NOT_CONNECTED')).toBeInTheDocument()
  })

  it('contains only the approved browser-safe environment contract', () => {
    const envPath = resolve(process.cwd(), '.env.example')
    expect(existsSync(envPath)).toBe(true)
    const content = existsSync(envPath) ? readFileSync(envPath, 'utf8') : ''
    const names = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => line.split('=')[0])
    expect(names).toEqual([
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      'NEXT_PUBLIC_APP_ENV',
    ])
  })

  it('defines an honest health contract without claiming gateway or backend connectivity', () => {
    const routePath = resolve(process.cwd(), 'app/api/health/route.ts')
    expect(existsSync(routePath)).toBe(true)
    const source = existsSync(routePath) ? readFileSync(routePath, 'utf8') : ''
    expect(source).toContain("app: 'ok'")
    expect(source).toContain("gateway: 'NOT_CONNECTED'")
    expect(source).toContain("backend: 'NOT_CONNECTED'")
  })
})
