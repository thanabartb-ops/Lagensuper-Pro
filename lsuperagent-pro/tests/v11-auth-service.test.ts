// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clearBrowserSession,
  getCurrentSession,
  sanitizeAuthNext,
  signInWithPassword,
  subscribeToAuthChanges,
  type AuthClientLike,
} from '../components/v11/services/browserAuth'

afterEach(() => {
  vi.restoreAllMocks()
})

function authClient(overrides: Partial<AuthClientLike['auth']>): AuthClientLike {
  return { auth: overrides as AuthClientLike['auth'] }
}

describe('browser auth service', () => {
  it('returns an authenticated session with its access token', async () => {
    const client = authClient({
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'user-token' } },
        error: null,
      }),
    })

    await expect(getCurrentSession(client)).resolves.toEqual({
      status: 'authenticated',
      accessToken: 'user-token',
    })
  })

  it('returns unauthenticated when there is no session', async () => {
    const client = authClient({
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    })

    await expect(getCurrentSession(client)).resolves.toEqual({ status: 'unauthenticated' })
  })

  it('normalizes invalid credentials without exposing raw Supabase text', async () => {
    const client = authClient({
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid login credentials' },
      }),
    })

    await expect(signInWithPassword('me@example.com', 'wrong', client)).resolves.toEqual({
      status: 'invalid_credentials',
    })
  })

  it('creates a signup session through the shared browser auth client', async () => {
    const module = await import('../components/v11/services/browserAuth')
    const signUp = (
      module as typeof module & {
        signUpWithPassword?: (
          email: string,
          password: string,
          client: AuthClientLike,
        ) => Promise<{ status: string }>
      }
    ).signUpWithPassword

    expect(signUp).toBeTypeOf('function')
    if (!signUp) return

    const signUpRequest = vi.fn().mockResolvedValue({
      data: { session: { access_token: 'new-user-token' }, user: { id: 'user-1' } },
      error: null,
    })
    const client = { auth: { signUp: signUpRequest } } as unknown as AuthClientLike

    await expect(signUp('new@example.com', 'secret', client)).resolves.toEqual({
      status: 'authenticated',
    })
    expect(signUpRequest).toHaveBeenCalledWith({ email: 'new@example.com', password: 'secret' })
  })

  it('reports confirmation required when signup creates a user without a session', async () => {
    const module = await import('../components/v11/services/browserAuth')
    const signUp = (
      module as typeof module & {
        signUpWithPassword?: (
          email: string,
          password: string,
          client: AuthClientLike,
        ) => Promise<{ status: string }>
      }
    ).signUpWithPassword

    expect(signUp).toBeTypeOf('function')
    if (!signUp) return

    const client = {
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: { session: null, user: { id: 'user-1' } },
          error: null,
        }),
      },
    } as unknown as AuthClientLike

    await expect(signUp('new@example.com', 'secret', client)).resolves.toEqual({
      status: 'confirmation_required',
    })
  })

  it('returns unavailable when auth cannot be reached', async () => {
    const client = authClient({
      getSession: vi.fn().mockRejectedValue(new Error('network down')),
    })

    await expect(getCurrentSession(client)).resolves.toEqual({ status: 'unavailable' })
  })

  it('allows only /chat as a post-login destination', () => {
    expect(sanitizeAuthNext('/chat')).toBe('/chat')
    expect(sanitizeAuthNext('https://evil.example')).toBe('/chat')
    expect(sanitizeAuthNext('//evil.example')).toBe('/chat')
    expect(sanitizeAuthNext('/settings')).toBe('/chat')
    expect(sanitizeAuthNext(null)).toBe('/chat')
  })

  it('clears a stale session without surfacing sign-out failure', async () => {
    const signOut = vi.fn().mockRejectedValue(new Error('already gone'))
    await expect(clearBrowserSession(authClient({ signOut }))).resolves.toBeUndefined()
    expect(signOut).toHaveBeenCalledTimes(1)
  })

  it('subscribes to auth changes and disposes the subscription', () => {
    const unsubscribe = vi.fn()
    let callback: ((_event: string, session: unknown) => void) | undefined
    const onAuthStateChange = vi.fn((cb: (_event: string, session: unknown) => void) => {
      callback = cb
      return { data: { subscription: { unsubscribe } } }
    })
    const listener = vi.fn()

    const dispose = subscribeToAuthChanges(listener, authClient({ onAuthStateChange }))
    callback?.('SIGNED_IN', { access_token: 'token' })
    callback?.('SIGNED_OUT', null)
    dispose()

    expect(listener).toHaveBeenNthCalledWith(1, true)
    expect(listener).toHaveBeenNthCalledWith(2, false)
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})
