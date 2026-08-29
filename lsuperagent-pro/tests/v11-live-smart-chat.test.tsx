// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { SmartChatView } from '../components/v11/components/chat/SmartChatView'
import {
  GatewayRuntimeAdapter,
  defaultRuntimeAdapter,
} from '../components/v11/services/runtimeAdapter'
import type { RuntimeGatewayStatus } from '../components/v11/types'

const connectedStatus: RuntimeGatewayStatus = {
  connected: true,
  statusText: 'CONNECTED',
  adapterName: 'GatewayRuntimeAdapter (V11 Public Beta)',
  mode: 'LiveGateway',
  apiLatencyMs: 12,
  activeProvider: 'gemini',
  supabaseAuth: 'READY',
  version: 'V11.0.4-beta',
  lastChecked: '2026-08-30T00:00:00.000Z',
}

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('V11 live Smart Chat adapter', () => {
  it('turns a verified provider-neutral chat response into a live assistant result', async () => {
    const adapter = new GatewayRuntimeAdapter(async () => ({
      status: 'verified' as const,
      requestId: 'req-1',
      data: {
        provider: 'gemini',
        model: 'gemini-runtime-test',
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
      activeProvider: 'gemini',
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

  it('keeps non-chat MVP routes on the existing mock boundary', async () => {
    const sender = vi.fn()
    const adapter = new GatewayRuntimeAdapter(sender)

    const result = await adapter.executePrompt('research this', 'deep_research')
    expect(result.status).toBe('NOT_CONNECTED')
    expect(result.message).toContain('[deep_research]')
    expect(sender).not.toHaveBeenCalled()
  })
})

describe('V11 Smart Chat status UI', () => {
  it('renders adapter-reported live status instead of a hard-coded DEMO/OFFLINE claim', async () => {
    vi.spyOn(defaultRuntimeAdapter, 'getStatus').mockResolvedValue(connectedStatus)

    render(<SmartChatView />)

    await waitFor(() => {
      expect(screen.getByText('LIVE')).toBeInTheDocument()
    })
    expect(screen.getByText(/สถานะ Gateway:/)).toHaveTextContent('CONNECTED')
    expect(screen.queryByText(/Mock Adapter ทำงาน/)).not.toBeInTheDocument()
  })
})
