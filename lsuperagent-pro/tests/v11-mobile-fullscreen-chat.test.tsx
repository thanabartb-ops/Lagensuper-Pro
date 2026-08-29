import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('V11 mobile full-screen chat regressions', () => {
  it('removes the marketing footer and page scrolling from the smart chat shell', () => {
    const shell = source('components/v11/V11Shell.tsx')

    expect(shell).toContain("const isChatRoute = currentRoute === 'smart_chat'")
    expect(shell).toContain("isChatRoute ? 'h-dvh overflow-hidden' : 'min-h-screen'")
    expect(shell).toContain("isChatRoute ? 'min-h-0 overflow-hidden' : ''")
    expect(shell).toContain('{!isChatRoute && (')
  })

  it('fills the dynamic shell while reserving space for mobile navigation', () => {
    const chat = source('components/v11/components/chat/SmartChatView.tsx')

    expect(chat).toContain('h-full')
    expect(chat).toContain('pb-16')
    expect(chat).toContain('md:pb-6')
    expect(chat).not.toContain('h-[calc(100vh-4rem)]')
  })
})
