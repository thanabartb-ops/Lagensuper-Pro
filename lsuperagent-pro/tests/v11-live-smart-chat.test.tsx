// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { SmartChatView } from '../components/v11/components/chat/SmartChatView'
import { V11Landing } from '../components/v11/V11Landing'
import {
  GatewayRuntimeAdapter,
  defaultRuntimeAdapter,
} from '../components/v11/services/runtimeAdapter'
import { peekPendingPrompt } from '../components/v11/services/promptHandoff'

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  cleanup()
  window.sessionStorage.clear()
  pushMock.mockReset()
  vi.restoreAllMocks()
})

describe('V11 live chat adapter', () => {
  it('turns a verified provider-neutral chat response into a real assistant result', async () => {
    const adapter = new GatewayRuntimeAdapter(async () => ({
      status: 'verified' as const,
      requestId: 'req-1',
      data: {
        provider: 'claude',
        model: 'runtime-test-model',
        output: { text: 'คำตอบจาก runtime จริง' },
      },
    }))

    await expect(adapter.executePrompt('ทดสอบ', 'smart_chat')).resolves.toEqual({
      status: 'SUCCESS',
      message: 'คำตอบจาก runtime จริง',
    })
    await expect(adapter.getStatus()).resolves.toMatchObject({
      connected: true,
      statusText: 'CONNECTED',
      mode: 'LiveGateway',
      activeProvider: 'claude',
      supabaseAuth: 'READY',
    })
  })

  it('fails closed when there is no authenticated Supabase session', async () => {
    const adapter = new GatewayRuntimeAdapter(async () => ({
      status: 'unauthenticated' as const,
    }))

    const result = await adapter.executePrompt('ทดสอบ', 'smart_chat')
    expect(result.status).toBe('UNAUTHENTICATED')
    expect(result.message).toContain('เข้าสู่ระบบ')
    await expect(adapter.getStatus()).resolves.toMatchObject({
      connected: false,
      statusText: 'NOT_CONNECTED',
      supabaseAuth: 'DISCONNECTED',
    })
  })

  it('keeps non-chat MVP routes outside this chat milestone', async () => {
    const sender = vi.fn()
    const adapter = new GatewayRuntimeAdapter(sender)

    const result = await adapter.executePrompt('research this', 'deep_research')
    expect(result.status).toBe('NOT_CONNECTED')
    expect(sender).not.toHaveBeenCalled()
  })
})

describe('V11 two chat entrypoints', () => {
  it('keeps the chat surface minimal with no fake connection labels', () => {
    render(<SmartChatView />)

    expect(screen.getByRole('heading', { name: 'LS_BOTAGENT' })).toBeInTheDocument()
    expect(screen.queryByText(/Smart Chat/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/DEMO/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/LIVE/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/สถานะ Gateway:/)).not.toBeInTheDocument()
    expect(screen.queryByText(/OFFLINE/i)).not.toBeInTheDocument()
  })

  it('sends a typed chat message through the runtime adapter and renders its reply', async () => {
    const execute = vi
      .spyOn(defaultRuntimeAdapter, 'executePrompt')
      .mockResolvedValue({ status: 'SUCCESS', message: 'คำตอบจริงจาก runtime' })

    render(<SmartChatView />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'ช่วยผมทดสอบระบบ' } })
    fireEvent.click(screen.getByRole('button', { name: 'ส่งข้อความ' }))

    await waitFor(() => {
      expect(execute).toHaveBeenCalledWith('ช่วยผมทดสอบระบบ', 'smart_chat')
    })
    await waitFor(
      () => expect(screen.getByText('คำตอบจริงจาก runtime')).toBeInTheDocument(),
      { timeout: 1500 },
    )
  })

  it('hands the landing composer prompt to /chat with a compact send control', () => {
    render(<V11Landing />)

    const input = screen.getByPlaceholderText(/พิมพ์ข้อความ/)
    const form = input.closest('form')
    expect(form).not.toBeNull()
    const composer = within(form as HTMLFormElement)

    fireEvent.change(input, { target: { value: 'ถามจากหน้าแรก' } })
    fireEvent.click(composer.getByRole('button', { name: 'ส่งข้อความ' }))

    expect(peekPendingPrompt()).toBe('ถามจากหน้าแรก')
    expect(pushMock).toHaveBeenCalledWith('/chat')
    expect(composer.queryByText('เริ่มต้นใช้งาน')).not.toBeInTheDocument()
  })
})
