import { createClient } from '@supabase/supabase-js'

export type AuthClientLike = {
  auth: {
    getSession?: () => Promise<unknown>
    signInWithPassword?: (credentials: { email: string; password: string }) => Promise<unknown>
    signUp?: (credentials: { email: string; password: string }) => Promise<unknown>
    signInWithOAuth?: (options: { provider: string; options?: { redirectTo?: string } }) => Promise<unknown>
    signOut?: () => Promise<unknown>
    onAuthStateChange?: (
      callback: (_event: string, session: unknown) => void,
    ) => { data: { subscription: { unsubscribe: () => void } } }
  }
}

export type BrowserSession =
  | { status: 'authenticated'; accessToken: string }
  | { status: 'unauthenticated' }
  | { status: 'unavailable' }

export type SignInResult =
  | { status: 'authenticated' }
  | { status: 'invalid_credentials' }
  | { status: 'unavailable' }

export type SignUpResult =
  | { status: 'authenticated' }
  | { status: 'confirmation_required' }
  | { status: 'invalid_signup' }
  | { status: 'unavailable' }

export type OAuthProvider = 'google' | 'microsoft' | 'apple'

export type SignInOAuthResult =
  | { status: 'authenticated' }
  | { status: 'unavailable' }

let browserClient: AuthClientLike | null = null

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && !Array.isArray(value) && typeof value === 'object'
}

function hasAccessToken(value: unknown): value is Record<string, unknown> & { access_token: string } {
  return isRecord(value) && typeof value.access_token === 'string' && value.access_token.length > 0
}

export function getBrowserAuthClient(): AuthClientLike | null {
  if (typeof window === 'undefined') return null

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? ''
  if (!url || !key) return null

  if (!browserClient) {
    browserClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }) as unknown as AuthClientLike
  }

  return browserClient
}

/**
 * This milestone has one protected destination only. Absolute,
 * protocol-relative, and unsupported paths all fail closed to /chat.
 */
export function sanitizeAuthNext(value: string | null): '/chat' {
  return value === '/chat' ? value : '/chat'
}

export async function getCurrentSession(
  client: AuthClientLike | null = getBrowserAuthClient(),
): Promise<BrowserSession> {
  if (!client?.auth.getSession) return { status: 'unavailable' }

  try {
    const result = await client.auth.getSession()
    if (!isRecord(result) || !isRecord(result.data)) {
      return { status: 'unauthenticated' }
    }

    if (result.error) return { status: 'unauthenticated' }

    const session = result.data.session
    if (!hasAccessToken(session)) return { status: 'unauthenticated' }

    return { status: 'authenticated', accessToken: session.access_token }
  } catch {
    return { status: 'unavailable' }
  }
}

function isInvalidCredentialError(error: unknown): boolean {
  if (!isRecord(error)) return false

  const code = typeof error.code === 'string' ? error.code.toLowerCase() : ''
  const message = typeof error.message === 'string' ? error.message.toLowerCase() : ''
  const status = typeof error.status === 'number' ? error.status : null

  return (
    code === 'invalid_credentials' ||
    message.includes('invalid login credentials') ||
    status === 400
  )
}

function isClientAuthError(error: unknown): boolean {
  if (!isRecord(error)) return false
  const status = typeof error.status === 'number' ? error.status : null
  return status !== null && status >= 400 && status < 500
}

export async function signInWithPassword(
  email: string,
  password: string,
  client: AuthClientLike | null = getBrowserAuthClient(),
): Promise<SignInResult> {
  const normalizedEmail = email.trim()
  if (!normalizedEmail || !password) return { status: 'invalid_credentials' }
  if (!client?.auth.signInWithPassword) return { status: 'unavailable' }

  try {
    const result = await client.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (!isRecord(result) || !isRecord(result.data)) {
      return { status: 'unavailable' }
    }

    if (result.error) {
      return {
        status: isInvalidCredentialError(result.error)
          ? 'invalid_credentials'
          : 'unavailable',
      }
    }

    const session = result.data.session
    if (!hasAccessToken(session)) return { status: 'invalid_credentials' }

    return { status: 'authenticated' }
  } catch {
    return { status: 'unavailable' }
  }
}

export async function signUpWithPassword(
  email: string,
  password: string,
  client: AuthClientLike | null = getBrowserAuthClient(),
): Promise<SignUpResult> {
  const normalizedEmail = email.trim()
  if (!normalizedEmail || !password) return { status: 'invalid_signup' }
  if (!client?.auth.signUp) return { status: 'unavailable' }

  try {
    const result = await client.auth.signUp({
      email: normalizedEmail,
      password,
    })

    if (!isRecord(result) || !isRecord(result.data)) {
      return { status: 'unavailable' }
    }

    if (result.error) {
      return {
        status: isClientAuthError(result.error) ? 'invalid_signup' : 'unavailable',
      }
    }

    if (hasAccessToken(result.data.session)) {
      return { status: 'authenticated' }
    }

    if (result.data.user) {
      return { status: 'confirmation_required' }
    }

    return { status: 'unavailable' }
  } catch {
    return { status: 'unavailable' }
  }
}

/**
 * Supabase names the Microsoft provider `azure`. The app keeps the
 * user-facing name, so the slug is translated at this boundary only.
 */
const SUPABASE_PROVIDER_SLUG: Record<OAuthProvider, string> = {
  google: 'google',
  microsoft: 'azure',
  apple: 'apple',
}

export async function signInWithOAuth(
  provider: OAuthProvider,
  client: AuthClientLike | null = getBrowserAuthClient(),
): Promise<SignInOAuthResult> {
  const slug = SUPABASE_PROVIDER_SLUG[provider]
  if (!slug) return { status: 'unavailable' }
  if (!client?.auth.signInWithOAuth) return { status: 'unavailable' }

  try {
    const result = await client.auth.signInWithOAuth({
      provider: slug,
    })

    if (!isRecord(result)) return { status: 'unavailable' }
    if (result.error) return { status: 'unavailable' }

    return { status: 'authenticated' }
  } catch {
    return { status: 'unavailable' }
  }
}

export async function clearBrowserSession(
  client: AuthClientLike | null = getBrowserAuthClient(),
): Promise<void> {
  try {
    await client?.auth.signOut?.()
  } catch {
    // Fail closed. Local sign-out cleanup is best effort after auth rejection.
  }
}

export function subscribeToAuthChanges(
  listener: (authenticated: boolean) => void,
  client: AuthClientLike | null = getBrowserAuthClient(),
): () => void {
  if (!client?.auth.onAuthStateChange) return () => undefined

  try {
    const result = client.auth.onAuthStateChange((_event, session) => {
      listener(hasAccessToken(session))
    })

    return () => result.data.subscription.unsubscribe()
  } catch {
    return () => undefined
  }
}
