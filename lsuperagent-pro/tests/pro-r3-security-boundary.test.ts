import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('PRO-R3 pre-live security boundary', () => {
  it('keeps the dispatcher offline and provider-neutral', () => {
    const dispatcher = source('lib/gateway/server-dispatch.ts')

    expect(dispatcher).not.toContain('fetch(')
    expect(dispatcher).not.toContain('process.env')
    expect(dispatcher).not.toContain('@supabase/')
    expect(dispatcher).not.toContain('openai')
    expect(dispatcher).not.toContain('anthropic')
    expect(dispatcher).not.toContain('gemini')
  })

  it('keeps the chat route isolated from live backends', () => {
    const route = source('app/api/chat/route.ts')

    expect(route).not.toContain('fetch(')
    expect(route).not.toContain('process.env')
    expect(route).not.toContain('@supabase/')
    expect(route).not.toContain('openai')
    expect(route).not.toContain('anthropic')
    expect(route).not.toContain('gemini')
  })
})
