// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { sessionMock, fetchMock } = vi.hoisted(() => ({
  sessionMock: vi.fn(),
  fetchMock: vi.fn(),
}))

vi.mock('../components/v11/services/browserAuth', () => ({
  getCurrentSession: sessionMock,
}))

import { defaultRuntimeAdapter } from '../components/v11/services/runtimeAdapter'

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  sessionMock.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('chat runtime shared auth boundary', () => {
  it('uses the shared browser-auth access token for /api/chat', async () => {
    sessionMock.mockResolvedValue({ status: 'authenticated', accessToken: 'shared-user-token' })
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: 'verified',
        requestId: 'req-shared-auth',
        data: {
          provider: 'claude',
          output: { text: 'คำตอบผ่าน shared auth' },
        },
      }),
    })

    await expect(defaultRuntimeAdapter.executePrompt('ทดสอบ shared auth', 'smart_chat')).resolves.toEqual({
      status: 'SUCCESS',
      message: 'คำตอบผ่าน shared auth',
    })

    expect(sessionMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/chat',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          authorization: 'Bearer shared-user-token',
        }),
      }),
    )
  })

  it('never calls /api/chat when the shared auth service has no session', async () => {
    sessionMock.mockResolvedValue({ status: 'unauthenticated' })

    const result = await defaultRuntimeAdapter.executePrompt('ห้ามส่ง', 'smart_chat')

    expect(result.status).toBe('UNAUTHENTICATED')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
