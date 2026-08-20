import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('PRO-R3 live-gateway source security boundary', () => {
  it('keeps network and server env access isolated to the canonical client', () => {
    const canonicalClient = source('lib/gateway/canonical-client.ts')
    const dispatcher = source('lib/gateway/server-dispatch.ts')
    const route = source('app/api/chat/route.ts')

    expect(canonicalClient).toContain('fetch')
    expect(canonicalClient).toContain('process.env')

    expect(dispatcher).not.toContain('fetch(')
    expect(dispatcher).not.toContain('process.env')
    expect(route).not.toContain('fetch(')
    expect(route).not.toContain('process.env')
  })

  it('keeps provider, direct Supabase, and public gateway authority absent', () => {
    const joined = [
      source('lib/gateway/canonical-client.ts'),
      source('lib/gateway/server-dispatch.ts'),
      source('app/api/chat/route.ts'),
    ]
      .join('\n')
      .toLowerCase()

    const forbidden = [
      '@supabase/',
      'openai',
      'anthropic',
      'gemini',
      'next_public_lsuperagent_gateway',
      'service_' + 'role',
    ]

    for (const marker of forbidden) {
      expect(joined).not.toContain(marker)
    }
  })
})
