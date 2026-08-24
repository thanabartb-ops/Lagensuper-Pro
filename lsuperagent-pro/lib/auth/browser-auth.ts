import { createClient } from '@supabase/supabase-js'

export type BrowserAuthConfig = {
  url: string
  publishableKey: string
}

export type AuthClientLike = {
  auth: {
    signInWithPassword?: (credentials: {
      email: string
      password: string
    }) => Promise<unknown>
    getSession?: () => Promise<unknown>
    signOut?: () => Promise<unknown>
  }
}

type BrowserAuthOptions = {
  client?: AuthClientLike
  fetchImpl?: typeof fetch
}

type AuthResult =
  | { status: 'authenticated'; userId: string }
  | { status: 'failed'; code: 'INVALID_CREDENTIALS' | 'AUTH_UNAVAILABLE' | 'SIGN_IN_FAILED' }

type ChatResult =
  | { status: 'verified'; requestId: string; data: unknown }
  | { status: 'unauthenticated' }
  | { status: 'failed'; code: string }

let browserClient: AuthClientLike | null = null

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && !Array.isArray(value) && typeof value === 'object'
}

export function readBrowserAuthConfig(
  env: Record<string, string | undefined>,
): BrowserAuthConfig | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ''
  const publishableKey =
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? ''

  if (!url || !publishableKey) return null

  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return null
  } catch {
    return null
  }

  return { url, publishableKey }
}

export function getBrowserAuthClient(): AuthClientLike | null {
  if (typeof window === 'undefined') return null

  const config = readBrowserAuthConfig({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  })
  if (!config) return null

  if (!browserClient) {
    browserClient = createClient(config.url, config.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }

  return browserClient
}

export async function signInWithPassword(
  email: string,
  password: string,
  options: BrowserAuthOptions = {},
): Promise<AuthResult> {
  const normalizedEmail = email.trim()
  if (!normalizedEmail || !password) {
    return { status: 'failed', code: 'INVALID_CREDENTIALS' }
  }

  const client = options.client ?? getBrowserAuthClient()
  if (!client?.auth.signInWithPassword) {
    return { status: 'failed', code: 'AUTH_UNAVAILABLE' }
  }

  try {
    const result = await client.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (!isRecord(result) || !isRecord(result.data) || result.error) {
      return { status: 'failed', code: 'SIGN_IN_FAILED' }
    }

    const session = result.data.session
    const user = result.data.user
    if (!isRecord(session) || !isRecord(user) || typeof user.id !== 'string') {
      return { status: 'failed', code: 'SIGN_IN_FAILED' }
    }

    if (
      typeof session.access_token !== 'string' ||
      session.access_token.length === 0
    ) {
      return { status: 'failed', code: 'SIGN_IN_FAILED' }
    }

    return { status: 'authenticated', userId: user.id }
  } catch {
    return { status: 'failed', code: 'SIGN_IN_FAILED' }
  }
}

export async function sendAuthenticatedChat(
  message: string,
  options: BrowserAuthOptions = {},
): Promise<ChatResult> {
  const client = options.client ?? getBrowserAuthClient()
  if (!client?.auth.getSession) return { status: 'unauthenticated' }

  let accessToken = ''
  try {
    const result = await client.auth.getSession()
    if (!isRecord(result) || !isRecord(result.data) || result.error) {
      return { status: 'unauthenticated' }
    }

    const session = result.data.session
    if (!isRecord(session) || typeof session.access_token !== 'string') {
      return { status: 'unauthenticated' }
    }
    accessToken = session.access_token
  } catch {
    return { status: 'unauthenticated' }
  }

  if (!accessToken) return { status: 'unauthenticated' }

  try {
    const response = await (options.fetchImpl ?? fetch)('/api/chat', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ message }),
    })

    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      return { status: 'failed', code: 'INVALID_RESPONSE' }
    }

    if (
      response.status === 200 &&
      isRecord(payload) &&
      payload.status === 'verified' &&
      typeof payload.requestId === 'string' &&
      'data' in payload
    ) {
      return {
        status: 'verified',
        requestId: payload.requestId,
        data: payload.data,
      }
    }

    if (response.status === 401) return { status: 'unauthenticated' }

    const code =
      isRecord(payload) && typeof payload.code === 'string'
        ? payload.code
        : 'UPSTREAM_UNAVAILABLE'
    return { status: 'failed', code }
  } catch {
    return { status: 'failed', code: 'UPSTREAM_UNAVAILABLE' }
  }
}
