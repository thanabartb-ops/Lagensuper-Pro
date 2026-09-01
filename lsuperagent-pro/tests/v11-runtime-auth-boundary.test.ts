// @vitest-environment jsdom
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
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

describe('gateway-to-runtime secret stays outside this app', () => {
  const GATEWAY_ONLY_SECRET = 'RUNTIME_SHARED_SECRET'

  function sourceFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) return sourceFiles(path)
      return /\.(ts|tsx)$/.test(entry.name) ? [path] : []
    })
  }

  /**
   * The gateway proves its own identity to the Supabase runtime with this
   * credential. It belongs to the W gateway server and the runtime secret store
   * only. This app never holds it, so a reference appearing here means it has
   * been pulled one hop too far toward the browser.
   */
  it('is absent from every browser component and service', () => {
    const offenders = sourceFiles(resolve(process.cwd(), 'components')).filter((path) =>
      readFileSync(path, 'utf8').includes(GATEWAY_ONLY_SECRET),
    )

    expect(offenders).toEqual([])
  })

  it('is absent from the server chat boundary and gateway client', () => {
    const serverSurface = [
      'app/api/chat/route.ts',
      ...sourceFiles(resolve(process.cwd(), 'lib/gateway')),
    ]

    for (const path of serverSurface) {
      expect(readFileSync(resolve(process.cwd(), path), 'utf8')).not.toContain(
        GATEWAY_ONLY_SECRET,
      )
    }
  })

  it('is absent from the public environment contract', () => {
    const envExample = readFileSync(resolve(process.cwd(), '.env.example'), 'utf8')

    expect(envExample).not.toContain(GATEWAY_ONLY_SECRET)
  })
})
