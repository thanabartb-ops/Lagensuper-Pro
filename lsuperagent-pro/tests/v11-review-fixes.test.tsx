import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AgentModeView } from '../components/v11/components/agent/AgentModeView'
import { AuditView } from '../components/v11/components/audit/AuditView'
import { HeroSection } from '../components/v11/components/landing/HeroSection'
import { MemoryView } from '../components/v11/components/memory/MemoryView'
import { SettingsView } from '../components/v11/components/settings/SettingsView'
import { pathToRoute } from '../components/v11/route-map'
import { setPendingPrompt, takePendingPrompt } from '../components/v11/services/promptHandoff'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  window.localStorage.clear()
  window.sessionStorage.clear()
  document.documentElement.classList.remove('reduce-motion')
})

describe('V11 review fixes', () => {
  it('hands a landing prompt to chat exactly once', () => {
    setPendingPrompt('  ทดสอบ prompt  ')
    expect(takePendingPrompt()).toBe('ทดสอบ prompt')
    expect(takePendingPrompt()).toBeNull()
  })

  it('maps the retained /tools route to projects navigation', () => {
    expect(pathToRoute('/tools')).toBe('projects')
  })

  it('persists settings and applies reduced motion', () => {
    vi.useFakeTimers()
    render(<SettingsView />)

    fireEvent.change(screen.getByLabelText('ชื่อเวิร์กสเปซ (Workspace Name)'), {
      target: { value: 'Bank V11 Workspace' },
    })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'บันทึกการเปลี่ยนแปลง' }))

    expect(window.localStorage.getItem('lsuperagent.v11.settings')).toContain('Bank V11 Workspace')
    expect(document.documentElement).toHaveClass('reduce-motion')
    expect(screen.getByText('บันทึกการตั้งค่าเรียบร้อยแล้ว')).toBeInTheDocument()
  })

  it('waits for explicit approval during a supervised agent run', () => {
    vi.useFakeTimers()
    render(<AgentModeView />)

    fireEvent.change(screen.getByPlaceholderText(/จัดทำแผนกลยุทธ์/), {
      target: { value: 'ทดสอบ supervised workflow' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'เริ่มต้นมอบหมายงานเอเจนท์' }))
    act(() => vi.advanceTimersByTime(1500))

    expect(screen.getByRole('button', { name: 'อนุมัติและดำเนินการต่อ' })).toBeInTheDocument()
    expect(screen.getByText(/รออนุมัติก่อนดำเนินขั้นที่ 2/)).toBeInTheDocument()
  })

  it('labels audit content as disconnected sample data', () => {
    render(<AuditView />)
    expect(screen.getByText('Local Verification (No Supabase Linked)')).toBeInTheDocument()
    expect(screen.getByText(/ข้อมูลที่แสดงเป็นชุดตัวอย่างคงที่/)).toBeInTheDocument()
  })

  it('presents authentication as unavailable instead of a dead sign-in action', () => {
    render(<HeroSection onStartClick={() => undefined} />)
    expect(screen.getByRole('button', { name: 'ระบบเข้าสู่ระบบยังไม่พร้อม (Preview)' })).toBeDisabled()
  })

  it('keeps memory delete controls visible and touch-sized', () => {
    render(<MemoryView />)
    const controls = screen.getAllByRole('button', { name: /ลบรายการความจำ:/ })
    expect(controls.length).toBeGreaterThan(0)
    expect(controls[0]).toHaveClass('min-h-[44px]', 'min-w-[44px]')
    expect(controls[0]).not.toHaveClass('opacity-0')
  })

  it('retains implementation guards for streaming, aspect ratio, markdown, and research depth', () => {
    const chat = readFileSync(
      resolve(process.cwd(), 'components/v11/components/chat/SmartChatView.tsx'),
      'utf8',
    )
    const image = readFileSync(
      resolve(process.cwd(), 'components/v11/components/image/ImageGenView.tsx'),
      'utf8',
    )
    const research = readFileSync(
      resolve(process.cwd(), 'components/v11/components/research/DeepResearchView.tsx'),
      'utf8',
    )

    expect(chat).toContain('intervalRef')
    expect(chat).toContain('controller.signal.aborted')
    expect(chat).toContain('<ReactMarkdown')
    expect(image).toContain('ASPECT_PRESET[activeItem.aspectRatio]')
    expect(research).toContain('const profile = DEPTH_PROFILE[depth]')
  })
})
