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
  }
}

type BrowserAuthOptions = {
  client?: AuthClientLike
  fetchImpl?: typeof fetch
}

export function readBrowserAuthConfig(
  _env: Record<string, string | undefined>,
): BrowserAuthConfig | null {
  return null
}

export async function signInWithPassword(
  _email: string,
  _password: string,
  _options: BrowserAuthOptions = {},
) {
  return { status: 'failed' as const, code: 'NOT_IMPLEMENTED' as const }
}

export async function sendAuthenticatedChat(
  _message: string,
  _options: BrowserAuthOptions = {},
) {
  return { status: 'unauthenticated' as const }
}
