import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('V11 second Codex review regressions', () => {
  it('keeps landing prompt storage intact until the surviving chat effect actually sends it', () => {
    const handoff = source('components/v11/services/promptHandoff.ts')
    const chat = source('components/v11/components/chat/SmartChatView.tsx')
    expect(handoff).toContain('peekPendingPrompt')
    expect(handoff).toContain('clearPendingPrompt')
    expect(chat).toContain('clearPendingPrompt(pending)')
    expect(chat).not.toContain('handoffConsumed')
  })

  it('owns chat status reset timers independently and clears stale resets before a new send', () => {
    const chat = source('components/v11/components/chat/SmartChatView.tsx')
    expect(chat).toContain('statusResetRef')
    expect(chat).toContain('clearStatusReset()')
    expect(chat).toContain('scheduleStatusReset')
  })

  it('restores reduced motion from the persistent V11 shell instead of settings cleanup', () => {
    const shell = source('components/v11/V11Shell.tsx')
    const settings = source('components/v11/components/settings/SettingsView.tsx')
    expect(shell).toContain("localStorage.getItem(SETTINGS_STORAGE_KEY)")
    expect(shell).toContain("classList.toggle('reduce-motion'")
    expect(settings).not.toContain("return () => document.documentElement.classList.remove('reduce-motion')")
  })

  it('renders generated research through the sanitized markdown path', () => {
    const research = source('components/v11/components/research/DeepResearchView.tsx')
    expect(research).toContain("import ReactMarkdown from 'react-markdown'")
    expect(research).toContain('<ReactMarkdown remarkPlugins={[remarkGfm]}>{task.report}</ReactMarkdown>')
  })

  it('rebuilds a rejected image brief from the edited prompt instead of resetting it', () => {
    const image = source('components/v11/components/image/ImageGenView.tsx')
    expect(image).toContain('onClick={handleGenerateBrief}')
    expect(image).toContain('สร้าง BRIEF ใหม่')
  })

  it('does not pre-populate output for the running first agent step', () => {
    const agent = source('components/v11/components/agent/AgentModeView.tsx')
    expect(agent).not.toContain("status: 'running',\n        output: 'แยกย่อยเป้าหมายออกเป็น 4 ข้อย่อย สำเร็จ'")
  })

  it('labels seeded memory records as samples rather than user memory', () => {
    const memory = source('components/v11/components/memory/MemoryView.tsx')
    expect(memory).toContain('SAMPLE · NOT USER MEMORY')
    expect(memory).toContain('ไม่ใช่ความจำผู้ใช้หรือข้อมูลที่อ่านจาก Supabase')
  })

  it('uses a mobile-safe research depth layout', () => {
    const research = source('components/v11/components/research/DeepResearchView.tsx')
    expect(research).toContain('grid w-full grid-cols-1 gap-1')
    expect(research).toContain('sm:grid-cols-3')
  })

  it('maps desktop project child routes to the Projects parent state', () => {
    const header = source('components/v11/components/common/Header.tsx')
    expect(header).toContain('PROJECT_CHILD_ROUTES')
    expect(header).toContain("route === 'projects' && PROJECT_CHILD_ROUTES.has(currentRoute)")
  })

  it('shows copy success only after clipboard write resolves', () => {
    const chat = source('components/v11/components/chat/SmartChatView.tsx')
    expect(chat).toContain('await navigator.clipboard.writeText(text)')
    expect(chat).toContain('catch')
  })
})
