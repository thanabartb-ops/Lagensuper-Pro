import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Home from '../app/page'
import { AppShell } from '../components/shell/AppShell'

afterEach(() => cleanup())

describe('LSUPERAGENT V11 AI Studio UI port', () => {
  it('renders the V11 Public Beta landing identity and honest gateway state', () => {
    render(
      <AppShell>
        <Home />
      </AppShell>,
    )

    expect(screen.getAllByText(/V11.*Public Beta/).length).toBeGreaterThan(0)
    expect(screen.getAllByText('AI ช่วยคิด ทำไว งานสำเร็จ').length).toBeGreaterThan(0)
    expect(screen.getAllByText('NOT_CONNECTED').length).toBeGreaterThan(0)
  })

  it('maps the five MVP routes to dedicated Next.js pages', () => {
    const routeContracts = [
      ['app/chat/page.tsx', 'smart_chat'],
      ['app/tools/deep-research/page.tsx', 'deep_research'],
      ['app/tools/create-image/page.tsx', 'create_image'],
      ['app/tools/agent-mode/page.tsx', 'agent_mode'],
      ['app/memory/page.tsx', 'memory'],
    ] as const

    for (const [file, route] of routeContracts) {
      const source = readFileSync(resolve(process.cwd(), file), 'utf8')
      expect(source).toContain(`route="${route}"`)
    }
  })
})
