import { describe, expect, it } from 'vitest'
import { TOOLS_DATA } from '../components/v11/data/toolsData'
import { MockRuntimeAdapter } from '../components/v11/services/runtimeAdapter'
import type { AppRoute } from '../components/v11/types'

describe('V11 mock runtime boundary', () => {
  it('remains disconnected and fails closed without provider execution', async () => {
    const adapter = new MockRuntimeAdapter()

    await expect(adapter.getStatus()).resolves.toMatchObject({
      connected: false,
      statusText: 'NOT_CONNECTED',
      mode: 'MockRuntimeAdapter',
      supabaseAuth: 'DISCONNECTED',
    })
    await expect(adapter.executePrompt('ทดสอบคำสั่ง', 'smart_chat')).resolves.toMatchObject({
      status: 'NOT_CONNECTED',
    })
  })

  it('keeps all five MVP runtime routes in the tool registry', () => {
    const requiredRoutes: AppRoute[] = [
      'smart_chat',
      'deep_research',
      'create_image',
      'agent_mode',
      'memory',
    ]
    const configuredRoutes = TOOLS_DATA.flatMap((tool) => (tool.route ? [tool.route] : []))

    expect(configuredRoutes).toEqual(expect.arrayContaining(requiredRoutes))
  })
})
