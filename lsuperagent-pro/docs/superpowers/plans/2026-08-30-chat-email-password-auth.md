# Chat Email/Password Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Require a real Supabase email/password session before LSUPERAGENT Chat mounts or sends a request, while preserving landing-page prompts across login and failing closed when a session expires.

**Architecture:** Add one shared browser-auth service around the existing Supabase publishable client, a dedicated `/login` page, and a client-side `RequireAuth` gate around `/chat`. `runtimeAdapter.ts` continues to send the Supabase access token to same-origin `/api/chat`; `SmartChatView` handles `UNAUTHENTICATED` by preserving the unsatisfied prompt, clearing the stale session, and returning to login.

**Tech Stack:** Next.js 16.3.1 App Router, React 19.2.8, TypeScript 5.x, `@supabase/supabase-js` 2.112.3, Vitest 4.1.11, Testing Library, Tailwind CSS 4.

**Spec:** `docs/superpowers/specs/2026-08-30-chat-email-password-auth-design.md`

## Global Constraints

- GitHub remains the code source of truth.
- The existing Supabase runtime remains runtime authority and must not be rebuilt or duplicated.
- `LS_BOTAGENT` remains the Chat assistant name.
- `/api/chat` remains the same-origin Chat boundary and still validates the Bearer token server-side.
- Browser code may use only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- No service-role key or provider secret may enter browser code.
- No guest or anonymous Chat fallback.
- No Sign up, Forgot/reset password, Magic Link, OAuth, Deep Research, Image, Agent Mode, or Memory changes in this milestone.
- Only `/chat` is an accepted post-login `next` destination in this milestone.
- Relevant mobile UI must be verified at exactly 393 x 852.
- Delivery remains branch -> checks -> Preview -> explicit production approval.
- Do not merge or deploy Production as part of this plan.
- Before implementation, read `AGENTS.md`, `.codex/LSUPERAGENT_CONTEXT.md`, and the relevant Next.js 16 guides under `node_modules/next/dist/docs/` as required by repository instructions.

---

## File map

### Create

- `components/v11/services/browserAuth.ts` — single browser Supabase client, normalized auth operations, auth subscription, safe `next` sanitizer.
- `components/v11/components/auth/LoginView.tsx` — minimal email/password form and user-safe auth errors.
- `components/v11/components/auth/RequireAuth.tsx` — blocks children until a valid session exists and redirects on sign-out/session loss.
- `app/login/page.tsx` — thin route wrapper around `LoginView`.
- `tests/v11-auth-flow.test.tsx` — auth service, login, route guard, landing handoff, and stale-session regression coverage.

### Modify

- `app/chat/page.tsx` — wrap `V11RouteView route="smart_chat"` in `RequireAuth`.
- `components/v11/V11Landing.tsx` — wire a real login action to `/login?next=/chat`.
- `components/v11/components/landing/HeroSection.tsx` — replace disabled preview login text with active `เข้าสู่ระบบ` action.
- `components/v11/services/runtimeAdapter.ts` — remove its private Supabase client and obtain the token through `browserAuth.ts`.
- `components/v11/components/chat/SmartChatView.tsx` — on `UNAUTHENTICATED`, preserve the exact unsatisfied prompt, clear stale auth, and return to login without rendering an assistant success.
- `tests/v11-live-smart-chat.test.tsx` — retain existing Chat behavior and add only the auth-expiry regression that belongs to Chat rendering.

No package dependency changes are expected.

---

### Task 1: Shared browser auth boundary

**Files:**
- Create: `components/v11/services/browserAuth.ts`
- Create/Test: `tests/v11-auth-flow.test.tsx`

**Interfaces:**
- Produces:
  - `type BrowserSession = { status: 'authenticated'; accessToken: string } | { status: 'unauthenticated' } | { status: 'unavailable' }`
  - `type SignInResult = { status: 'authenticated' } | { status: 'invalid_credentials' } | { status: 'unavailable' }`
  - `getBrowserAuthClient(): AuthClientLike | null`
  - `getCurrentSession(client?: AuthClientLike | null): Promise<BrowserSession>`
  - `signInWithPassword(email: string, password: string, client?: AuthClientLike | null): Promise<SignInResult>`
  - `clearBrowserSession(client?: AuthClientLike | null): Promise<void>`
  - `subscribeToAuthChanges(listener: (authenticated: boolean) => void, client?: AuthClientLike | null): () => void`
  - `sanitizeAuthNext(value: string | null): '/chat'`
- Consumes: existing `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `@supabase/supabase-js`.

- [ ] **Step 1: Read repository and Next.js guidance before code**

Run from `lsuperagent-pro`:

```bash
cat AGENTS.md
cat .codex/LSUPERAGENT_CONTEXT.md
find node_modules/next/dist/docs -maxdepth 3 -type f | grep -E 'app|navigation|client' | head -40
```

Read the App Router/client navigation guide that applies to `useRouter()` and client components. Do not change code during this step.

- [ ] **Step 2: Write failing auth-service tests**

Create `tests/v11-auth-flow.test.tsx`:

```tsx
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getCurrentSession,
  sanitizeAuthNext,
  signInWithPassword,
  type AuthClientLike,
} from '../components/v11/services/browserAuth'

afterEach(() => {
  cleanup()
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

  it('allows only /chat as a post-login destination', () => {
    expect(sanitizeAuthNext('/chat')).toBe('/chat')
    expect(sanitizeAuthNext('https://evil.example')).toBe('/chat')
    expect(sanitizeAuthNext('//evil.example')).toBe('/chat')
    expect(sanitizeAuthNext('/settings')).toBe('/chat')
    expect(sanitizeAuthNext(null)).toBe('/chat')
  })
})
```

- [ ] **Step 3: Run the focused test and confirm RED**

```bash
pnpm vitest run tests/v11-auth-flow.test.tsx
```

Expected: FAIL because `components/v11/services/browserAuth.ts` does not exist.

- [ ] **Step 4: Implement the minimal browser auth service**

Create `components/v11/services/browserAuth.ts` with these exact public types and helpers:

```ts
import { createClient } from '@supabase/supabase-js'

export type AuthClientLike = {
  auth: {
    getSession?: () => Promise<unknown>
    signInWithPassword?: (credentials: { email: string; password: string }) => Promise<unknown>
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

let browserClient: AuthClientLike | null = null

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && !Array.isArray(value) && typeof value === 'object'
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
    }) as AuthClientLike
  }
  return browserClient
}

export function sanitizeAuthNext(_value: string | null): '/chat' {
  return '/chat'
}

export async function getCurrentSession(
  client: AuthClientLike | null = getBrowserAuthClient(),
): Promise<BrowserSession> {
  if (!client?.auth.getSession) return { status: 'unavailable' }
  try {
    const result = await client.auth.getSession()
    if (!isRecord(result) || result.error || !isRecord(result.data)) {
      return { status: 'unauthenticated' }
    }
    const session = result.data.session
    if (!isRecord(session) || typeof session.access_token !== 'string' || !session.access_token) {
      return { status: 'unauthenticated' }
    }
    return { status: 'authenticated', accessToken: session.access_token }
  } catch {
    return { status: 'unavailable' }
  }
}
```

Implement the remaining functions with the following exact behavior:

```ts
export async function signInWithPassword(
  email: string,
  password: string,
  client: AuthClientLike | null = getBrowserAuthClient(),
): Promise<SignInResult> {
  const normalizedEmail = email.trim()
  if (!normalizedEmail || !password) return { status: 'invalid_credentials' }
  if (!client?.auth.signInWithPassword) return { status: 'unavailable' }

  try {
    const result = await client.auth.signInWithPassword({ email: normalizedEmail, password })
    if (!isRecord(result) || result.error || !isRecord(result.data)) {
      return { status: 'invalid_credentials' }
    }
    const session = result.data.session
    if (!isRecord(session) || typeof session.access_token !== 'string' || !session.access_token) {
      return { status: 'invalid_credentials' }
    }
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
    // Fail closed: local sign-out cleanup is best effort.
  }
}

export function subscribeToAuthChanges(
  listener: (authenticated: boolean) => void,
  client: AuthClientLike | null = getBrowserAuthClient(),
): () => void {
  if (!client?.auth.onAuthStateChange) return () => undefined
  const { data } = client.auth.onAuthStateChange((_event, session) => {
    const authenticated =
      isRecord(session) && typeof session.access_token === 'string' && session.access_token.length > 0
    listener(authenticated)
  })
  return () => data.subscription.unsubscribe()
}
```

- [ ] **Step 5: Run focused tests and confirm GREEN**

```bash
pnpm vitest run tests/v11-auth-flow.test.tsx
```

Expected: all Task 1 tests PASS.

- [ ] **Step 6: Commit Task 1**

```bash
git add components/v11/services/browserAuth.ts tests/v11-auth-flow.test.tsx
git commit -m "feat: add shared browser auth service"
```

---

### Task 2: Minimal email/password login route

**Files:**
- Create: `components/v11/components/auth/LoginView.tsx`
- Create: `app/login/page.tsx`
- Modify/Test: `tests/v11-auth-flow.test.tsx`

**Interfaces:**
- Consumes: `signInWithPassword()` and `sanitizeAuthNext()` from Task 1.
- Produces: `/login` UI with email/password form and safe post-login navigation.

- [ ] **Step 1: Add failing LoginView tests**

At the top of `tests/v11-auth-flow.test.tsx`, add:

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { LoginView } from '../components/v11/components/auth/LoginView'

const { pushMock, signInMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  signInMock: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: pushMock }),
  useSearchParams: () => new URLSearchParams('next=/chat'),
}))

vi.mock('../components/v11/services/browserAuth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../components/v11/services/browserAuth')>()
  return { ...actual, signInWithPassword: signInMock }
})

function fillLoginForm() {
  fireEvent.change(screen.getByLabelText('อีเมล'), { target: { value: 'me@example.com' } })
  fireEvent.change(screen.getByLabelText('รหัสผ่าน'), { target: { value: 'secret' } })
}
```

Add these tests:

```tsx
it('logs in with email/password and returns to /chat', async () => {
  signInMock.mockResolvedValue({ status: 'authenticated' })
  render(<LoginView />)
  fillLoginForm()
  fireEvent.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }))
  await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/chat'))
})

it('shows a safe Thai message for invalid credentials', async () => {
  signInMock.mockResolvedValue({ status: 'invalid_credentials' })
  render(<LoginView />)
  fillLoginForm()
  fireEvent.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }))
  expect(await screen.findByText('อีเมลหรือรหัสผ่านไม่ถูกต้อง')).toBeInTheDocument()
  expect(pushMock).not.toHaveBeenCalled()
})

it('shows service unavailable without raw provider text', async () => {
  signInMock.mockResolvedValue({ status: 'unavailable' })
  render(<LoginView />)
  fillLoginForm()
  fireEvent.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }))
  expect(
    await screen.findByText('ระบบเข้าสู่ระบบยังไม่พร้อม กรุณาลองใหม่อีกครั้ง'),
  ).toBeInTheDocument()
})

it('blocks duplicate submit while sign-in is pending', async () => {
  let resolve!: (value: { status: 'authenticated' }) => void
  signInMock.mockReturnValue(new Promise((r) => { resolve = r }))
  render(<LoginView />)
  fillLoginForm()
  const button = screen.getByRole('button', { name: 'เข้าสู่ระบบ' })
  fireEvent.click(button)
  fireEvent.click(button)
  expect(signInMock).toHaveBeenCalledTimes(1)
  expect(button).toBeDisabled()
  resolve({ status: 'authenticated' })
  await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/chat'))
})
```

- [ ] **Step 2: Run focused test and confirm RED**

```bash
pnpm vitest run tests/v11-auth-flow.test.tsx
```

Expected: FAIL because `LoginView` and `/login` do not exist.

- [ ] **Step 3: Implement LoginView**

Create `components/v11/components/auth/LoginView.tsx`:

```tsx
'use client'

import { FormEvent, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { sanitizeAuthNext, signInWithPassword } from '../../services/browserAuth'

export function LoginView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorText, setErrorText] = useState('')

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setErrorText('')

    const result = await signInWithPassword(email, password)
    if (result.status === 'authenticated') {
      router.push(sanitizeAuthNext(searchParams.get('next')))
      return
    }

    setErrorText(
      result.status === 'invalid_credentials'
        ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
        : 'ระบบเข้าสู่ระบบยังไม่พร้อม กรุณาลองใหม่อีกครั้ง',
    )
    setSubmitting(false)
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4 py-10">
      <section className="w-full rounded-2xl border border-[#312E81] bg-[#131525] p-5 sm:p-7">
        <p className="mb-2 text-sm font-bold tracking-wide text-white/70">LSUPERAGENT</p>
        <h1 className="mb-6 text-2xl font-bold text-white">เข้าสู่ระบบ</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-sm text-white/70">อีเมล</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-[#312E81] bg-[#0C0D1A] px-3 text-white outline-none focus:border-[#7B2CFE]"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-1.5 block text-sm text-white/70">รหัสผ่าน</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-[#312E81] bg-[#0C0D1A] px-3 text-white outline-none focus:border-[#7B2CFE]"
            />
          </div>
          {errorText ? <p role="alert" className="text-sm text-red-300">{errorText}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="min-h-[44px] w-full rounded-xl bg-gradient-to-r from-[#FF00FF] to-[#7B2CFE] font-bold text-white disabled:opacity-50"
          >
            เข้าสู่ระบบ
          </button>
        </form>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="mt-4 min-h-[44px] w-full text-sm text-white/60 hover:text-white"
        >
          กลับหน้าหลัก
        </button>
      </section>
    </main>
  )
}
```

- [ ] **Step 4: Add the `/login` route**

Create `app/login/page.tsx`:

```tsx
import { LoginView } from '@/components/v11/components/auth/LoginView'

export default function LoginPage() {
  return <LoginView />
}
```

- [ ] **Step 5: Run focused tests and confirm GREEN**

```bash
pnpm vitest run tests/v11-auth-flow.test.tsx
```

Expected: all Login tests PASS.

- [ ] **Step 6: Commit Task 2**

```bash
git add app/login/page.tsx components/v11/components/auth/LoginView.tsx tests/v11-auth-flow.test.tsx
git commit -m "feat: add email password login page"
```

---

### Task 3: Guard `/chat` before SmartChatView mounts

**Files:**
- Create: `components/v11/components/auth/RequireAuth.tsx`
- Modify: `app/chat/page.tsx`
- Modify/Test: `tests/v11-auth-flow.test.tsx`

**Interfaces:**
- Consumes: `getCurrentSession()` and `subscribeToAuthChanges()` from Task 1.
- Produces: `RequireAuth({ children }: { children: React.ReactNode })` that never mounts Chat while unauthenticated/checking.

- [ ] **Step 1: Add failing route-guard tests**

Mock `getCurrentSession` and `subscribeToAuthChanges` in `tests/v11-auth-flow.test.tsx` and add:

```tsx
it('redirects unauthenticated chat before protected children mount', async () => {
  getSessionMock.mockResolvedValue({ status: 'unauthenticated' })
  subscribeMock.mockReturnValue(() => undefined)
  const childMounted = vi.fn()
  function Child() {
    childMounted()
    return <div>protected chat</div>
  }

  render(<RequireAuth><Child /></RequireAuth>)
  await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/login?next=/chat'))
  expect(childMounted).not.toHaveBeenCalled()
})

it('renders protected Chat when a valid session exists', async () => {
  getSessionMock.mockResolvedValue({ status: 'authenticated', accessToken: 'user-token' })
  subscribeMock.mockReturnValue(() => undefined)
  render(<RequireAuth><div>protected chat</div></RequireAuth>)
  expect(await screen.findByText('protected chat')).toBeInTheDocument()
})
```

Capture the subscription callback and add a third test: after authenticated mount, invoke it with `false`; expect `/login?next=/chat` navigation and protected content to unmount.

- [ ] **Step 2: Confirm RED**

```bash
pnpm vitest run tests/v11-auth-flow.test.tsx
```

Expected: FAIL because `RequireAuth` does not exist.

- [ ] **Step 3: Implement RequireAuth**

Create `components/v11/components/auth/RequireAuth.tsx`:

```tsx
'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentSession, subscribeToAuthChanges } from '../../services/browserAuth'

export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [state, setState] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking')

  useEffect(() => {
    let active = true
    void getCurrentSession().then((session) => {
      if (!active) return
      if (session.status === 'authenticated') {
        setState('authenticated')
      } else {
        setState('unauthenticated')
        router.push('/login?next=/chat')
      }
    })

    const unsubscribe = subscribeToAuthChanges((authenticated) => {
      if (!active) return
      if (authenticated) {
        setState('authenticated')
      } else {
        setState('unauthenticated')
        router.push('/login?next=/chat')
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [router])

  if (state !== 'authenticated') {
    return <div role="status" aria-live="polite" className="min-h-[40vh]" />
  }

  return <>{children}</>
}
```

- [ ] **Step 4: Wrap the Chat route**

Modify `app/chat/page.tsx`:

```tsx
import { RequireAuth } from '@/components/v11/components/auth/RequireAuth'
import { V11RouteView } from '@/components/v11/V11RouteView'

export default function ChatPage() {
  return (
    <RequireAuth>
      <V11RouteView route="smart_chat" />
    </RequireAuth>
  )
}
```

- [ ] **Step 5: Run focused tests and confirm GREEN**

```bash
pnpm vitest run tests/v11-auth-flow.test.tsx
```

Expected: all guard tests PASS.

- [ ] **Step 6: Commit Task 3**

```bash
git add app/chat/page.tsx components/v11/components/auth/RequireAuth.tsx tests/v11-auth-flow.test.tsx
git commit -m "feat: require auth before chat mounts"
```

---

### Task 4: Make the landing Login action real and keep prompt handoff intact

**Files:**
- Modify: `components/v11/V11Landing.tsx`
- Modify: `components/v11/components/landing/HeroSection.tsx`
- Modify/Test: `tests/v11-auth-flow.test.tsx`
- Regression: `tests/v11-live-smart-chat.test.tsx`

**Interfaces:**
- Produces: `HeroSection` accepts `onLoginClick: () => void` and shows active `เข้าสู่ระบบ` button.
- Consumes: existing `setPendingPrompt()` and `routeToPath.smart_chat` behavior.

- [ ] **Step 1: Write failing landing-login test**

Render `V11Landing`, click `เข้าสู่ระบบ`, and assert:

```tsx
expect(pushMock).toHaveBeenCalledWith('/login?next=/chat')
```

Keep the existing composer regression asserting that a typed prompt is stored and navigation goes to `/chat`:

```tsx
fireEvent.change(screen.getByPlaceholderText(/พิมพ์ข้อความ/), {
  target: { value: 'ถามจากหน้าแรก' },
})
fireEvent.click(screen.getByRole('button', { name: 'ส่งข้อความ' }))
expect(peekPendingPrompt()).toBe('ถามจากหน้าแรก')
expect(pushMock).toHaveBeenCalledWith('/chat')
```

- [ ] **Step 2: Confirm RED for the login action**

```bash
pnpm vitest run tests/v11-auth-flow.test.tsx tests/v11-live-smart-chat.test.tsx
```

Expected: the new Login action test FAILS because the current Hero login control is disabled preview copy.

- [ ] **Step 3: Wire V11Landing login navigation**

Add:

```tsx
const handleLogin = () => router.push('/login?next=/chat')
```

Render:

```tsx
<HeroSection onStartClick={handleStart} onLoginClick={handleLogin} />
```

- [ ] **Step 4: Replace the disabled Hero login control**

Change the props:

```ts
interface HeroSectionProps {
  onStartClick: () => void
  onLoginClick: () => void
}
```

Render this active secondary action:

```tsx
<button
  type="button"
  onClick={onLoginClick}
  className="mt-4 flex min-h-[44px] items-center justify-center px-3 py-1.5 text-xs text-white/70 transition-colors hover:text-white sm:text-sm"
>
  เข้าสู่ระบบ
</button>
```

Do not add signup/recovery links.

- [ ] **Step 5: Run landing and Chat regressions**

```bash
pnpm vitest run tests/v11-auth-flow.test.tsx tests/v11-live-smart-chat.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit Task 4**

```bash
git add components/v11/V11Landing.tsx components/v11/components/landing/HeroSection.tsx tests/v11-auth-flow.test.tsx tests/v11-live-smart-chat.test.tsx
git commit -m "feat: wire landing login entrypoint"
```

---

### Task 5: Reuse browser auth in runtime adapter and recover from runtime 401

**Files:**
- Modify: `components/v11/services/runtimeAdapter.ts`
- Modify: `components/v11/components/chat/SmartChatView.tsx`
- Modify/Test: `tests/v11-live-smart-chat.test.tsx`
- Modify/Test: `tests/v11-auth-flow.test.tsx`

**Interfaces:**
- Consumes: `getCurrentSession()`, `clearBrowserSession()` from Task 1 and existing `setPendingPrompt()`.
- Produces: one browser auth client for Login + Chat and deterministic 401 recovery.

- [ ] **Step 1: Write failing runtime-auth tests**

Mock `getCurrentSession()` to return `{ status: 'authenticated', accessToken: 'user-token' }`, stub `fetch`, execute a Chat prompt, and assert the network call contains:

```ts
expect(fetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
  method: 'POST',
  headers: expect.objectContaining({ authorization: 'Bearer user-token' }),
}))
```

Add another test where `getCurrentSession()` returns `{ status: 'unauthenticated' }`; assert `fetch` is not called and `GatewayRuntimeAdapter.executePrompt()` returns status `UNAUTHENTICATED`.

- [ ] **Step 2: Write failing stale-session recovery test**

Mock `defaultRuntimeAdapter.executePrompt()` to resolve:

```ts
{ status: 'UNAUTHENTICATED', message: 'กรุณาเข้าสู่ระบบ' }
```

Render `SmartChatView`, type `งานที่ยังไม่สำเร็จ`, submit, then assert:

```tsx
await waitFor(() => expect(peekPendingPrompt()).toBe('งานที่ยังไม่สำเร็จ'))
expect(clearSessionMock).toHaveBeenCalledTimes(1)
expect(pushMock).toHaveBeenCalledWith('/login?next=/chat')
expect(screen.queryByText('กรุณาเข้าสู่ระบบ')).not.toBeInTheDocument()
```

- [ ] **Step 3: Confirm RED**

```bash
pnpm vitest run tests/v11-live-smart-chat.test.tsx tests/v11-auth-flow.test.tsx
```

Expected: FAIL because `runtimeAdapter.ts` still creates its own Supabase client and `SmartChatView` currently renders every adapter message.

- [ ] **Step 4: Refactor runtimeAdapter to use browserAuth**

Remove the direct Supabase import, `browserSupabase`, and `getBrowserSupabase()` from `runtimeAdapter.ts`.

Add:

```ts
import { getCurrentSession } from './browserAuth'
```

In the authenticated sender:

```ts
const session = await getCurrentSession()
if (session.status !== 'authenticated') {
  return { status: 'unauthenticated' }
}

const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    authorization: `Bearer ${session.accessToken}`,
  },
  body: JSON.stringify({ message }),
})
```

Keep verified-response parsing and all non-Chat behavior unchanged. Update only the unauthenticated copy to:

```ts
return {
  status: 'UNAUTHENTICATED',
  message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน Chat',
}
```

- [ ] **Step 5: Handle UNAUTHENTICATED in SmartChatView before rendering**

Add:

```tsx
import { useRouter } from 'next/navigation'
import { clearBrowserSession } from '../../services/browserAuth'
import { clearPendingPrompt, peekPendingPrompt, setPendingPrompt } from '../../services/promptHandoff'
```

Inside the component:

```tsx
const router = useRouter()
```

Immediately after `executePrompt()` returns and after the abort check:

```tsx
if (result.status === 'UNAUTHENTICATED') {
  setPendingPrompt(text)
  await clearBrowserSession()
  if (!controller.signal.aborted) {
    abortRef.current = null
    setMessages((prev) => prev.filter((message) => message.id !== botMsgId))
    setStreamingStatus('idle')
    router.push('/login?next=/chat')
  }
  return
}
```

Add `router` to the `handleSendMessage` dependency list. Do not render the adapter's unauthenticated message as an assistant response.

- [ ] **Step 6: Run focused auth + Chat tests**

```bash
pnpm vitest run tests/v11-auth-flow.test.tsx tests/v11-live-smart-chat.test.tsx
```

Expected: PASS, including prompt preservation and no fake assistant answer on 401.

- [ ] **Step 7: Run all tests**

```bash
pnpm test
```

Expected: all tests PASS.

- [ ] **Step 8: Commit Task 5**

```bash
git add components/v11/services/runtimeAdapter.ts components/v11/components/chat/SmartChatView.tsx tests/v11-auth-flow.test.tsx tests/v11-live-smart-chat.test.tsx
git commit -m "feat: fail closed when chat session expires"
```

---

### Task 6: Full verification, Preview, and mobile acceptance

**Files:**
- Review all Task 1-5 files; make no unrelated changes.

**Interfaces:**
- Consumes: completed auth flow from Tasks 1-5.
- Produces: evidence that the branch is safe for Preview review; does not authorize Production.

- [ ] **Step 1: Run fresh full verification**

```bash
pnpm verify
```

Expected, all exit code 0:
- `pnpm guard:secrets`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

- [ ] **Step 2: Inspect final diff for scope and secrets**

```bash
git diff main...HEAD -- app/login app/chat components/v11/components/auth components/v11/components/chat components/v11/components/landing components/v11/services tests
```

Confirm no service-role/provider keys, no browser-to-provider call, no Research/Image/Agent/Memory execution change, and no signup/reset/OAuth feature.

- [ ] **Step 3: Push only the feature branch and wait for Preview checks**

Confirm repository verification workflows pass on the final head and Vercel reports a successful Preview deployment. Do not merge `main`.

- [ ] **Step 4: Verify unauthenticated flow at exactly 393 x 852**

1. Clear the browser Supabase session.
2. Open `/chat` directly.
3. Confirm Chat UI never flashes before redirect.
4. Confirm destination `/login?next=/chat`.
5. Confirm Login has no horizontal overflow and all inputs/buttons remain comfortably tappable.
6. Submit known-invalid credentials and confirm only `อีเมลหรือรหัสผ่านไม่ถูกต้อง` appears.
7. Confirm no `/api/chat` request occurs while unauthenticated.

- [ ] **Step 5: Verify authenticated prompt handoff at exactly 393 x 852**

Using a valid Supabase email/password account provisioned outside this implementation:

1. Sign out.
2. Open `/`.
3. Type `AUTH-HANDOFF-393-852` into the landing composer.
4. Submit.
5. Confirm login gate appears before Chat execution.
6. Sign in.
7. Confirm `/chat` opens and the exact prompt is delivered once.
8. Confirm browser traffic shows `POST /api/chat` with a Bearer user token and no provider credential.

Do not paste or commit real credentials into tests, docs, issues, or logs.

- [ ] **Step 6: Verify stale-session/401 recovery**

1. Use a controlled invalid/expired local session or controlled Preview response that produces `/api/chat` 401.
2. Type a unique prompt and submit.
3. Confirm no assistant success is rendered.
4. Confirm navigation to `/login?next=/chat`.
5. Sign in again.
6. Confirm the preserved prompt is delivered exactly once.

- [ ] **Step 7: Record evidence and stop at production gate**

Record final branch head SHA, fresh R1/R2 results, Preview status/link, 393 x 852 result, prompt-handoff result, and 401-recovery result. Report downstream runtime readiness separately from auth readiness.

Explicitly state: **Production remains unchanged. Merge/deploy requires separate user approval.**

---

## Self-review result

- Spec coverage: Login, guard-before-mount, shared Supabase client, safe `next`, landing prompt preservation, direct `/chat`, runtime 401 recovery, fail-closed behavior, mobile verification, and production gate are mapped above.
- Placeholder scan: no TODO, TBD, omitted code instruction, or deferred feature remains.
- Type consistency: Task 1 defines the exact auth-service exports consumed by Tasks 2, 3, and 5.
- Scope: one subsystem only — email/password authentication for Chat. No package, database, provider, or other capability work is required.
