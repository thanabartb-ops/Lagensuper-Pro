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
- `tests/v11-live-smart-chat.test.tsx` — update only assertions affected by the auth boundary and add 401/prompt-preservation regression coverage if that behavior is clearer here than in `v11-auth-flow.test.tsx`.

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

Start `tests/v11-auth-flow.test.tsx` with jsdom and these concrete behaviors:

```tsx
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getCurrentSession,
  signInWithPassword,
  sanitizeAuthNext,
  type AuthClientLike,
} from '../components/v11/services/browserAuth'

afterEach(() => vi.restoreAllMocks())

function authClient(overrides: Partial<AuthClientLike['auth']>): AuthClientLike {
  return { auth: overrides as AuthClientLike['auth'] }
}

describe('browser auth service', () => {
  it('returns the current access token for an authenticated session', async () => {
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

  it('normalizes invalid credentials without exposing a raw Supabase error', async () => {
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

Run:

```bash
pnpm vitest run tests/v11-auth-flow.test.tsx
```

Expected: FAIL because `components/v11/services/browserAuth.ts` and its exports do not exist yet.

- [ ] **Step 4: Implement the minimal browser auth service**

Create `components/v11/services/browserAuth.ts` with this structure:

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

export function sanitizeAuthNext(value: string | null): '/chat' {
  return value === '/chat' ? '/chat' : '/chat'
}
```

Then implement `getCurrentSession`, `signInWithPassword`, `clearBrowserSession`, and `subscribeToAuthChanges` using record-shape checks rather than trusting `unknown` results. Required behavior:

```ts
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

For `signInWithPassword`:
- trim email;
- empty email/password -> `invalid_credentials`;
- missing client/method or thrown exception -> `unavailable`;
- a response with an error or without both a session and access token -> `invalid_credentials`;
- success -> `authenticated`.

For `clearBrowserSession`, call `signOut()` if present and swallow failure because the desired local outcome is still fail-closed.

For `subscribeToAuthChanges`, return a no-op disposer if the client/method is unavailable; otherwise call `onAuthStateChange`, treat a session containing a non-empty `access_token` as authenticated, and return `subscription.unsubscribe`.

- [ ] **Step 5: Run focused tests and confirm GREEN**

Run:

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

Append tests using a hoisted `pushMock` and mocked `next/navigation`:

```tsx
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { LoginView } from '../components/v11/components/auth/LoginView'

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: pushMock }),
  useSearchParams: () => new URLSearchParams('next=/chat'),
}))

afterEach(() => {
  cleanup()
  pushMock.mockReset()
  vi.restoreAllMocks()
})
```

Mock `signInWithPassword` at module level and test:

```tsx
it('logs in with email/password and returns only to /chat', async () => {
  signInMock.mockResolvedValue({ status: 'authenticated' })
  render(<LoginView />)

  fireEvent.change(screen.getByLabelText('อีเมล'), { target: { value: 'me@example.com' } })
  fireEvent.change(screen.getByLabelText('รหัสผ่าน'), { target: { value: 'secret' } })
  fireEvent.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }))

  await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/chat'))
})

it('shows a safe Thai message for invalid credentials', async () => {
  signInMock.mockResolvedValue({ status: 'invalid_credentials' })
  render(<LoginView />)
  // fill both fields and submit
  await screen.findByText('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
  expect(pushMock).not.toHaveBeenCalled()
})

it('shows service unavailable without raw provider text', async () => {
  signInMock.mockResolvedValue({ status: 'unavailable' })
  render(<LoginView />)
  // fill both fields and submit
  await screen.findByText('ระบบเข้าสู่ระบบยังไม่พร้อม กรุณาลองใหม่อีกครั้ง')
})
```

Add one deferred-promise test that clicks submit twice while sign-in is pending and expects one call plus a disabled submit button.

- [ ] **Step 2: Run focused test and confirm RED**

```bash
pnpm vitest run tests/v11-auth-flow.test.tsx
```

Expected: FAIL because `LoginView` and route do not exist.

- [ ] **Step 3: Implement LoginView**

Create `components/v11/components/auth/LoginView.tsx` as a client component. Use these exact user-facing strings:

```tsx
'use client'

import { FormEvent, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithPassword, sanitizeAuthNext } from '../../services/browserAuth'

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

  // render minimal single-column form
}
```

Render requirements:
- visible `LSUPERAGENT` brand;
- heading `เข้าสู่ระบบ`;
- `<label htmlFor="login-email">อีเมล</label>` + `type="email"`, `autoComplete="email"`;
- `<label htmlFor="login-password">รหัสผ่าน</label>` + `type="password"`, `autoComplete="current-password"`;
- submit button text `เข้าสู่ระบบ`, minimum 44px height, disabled while submitting;
- error container `role="alert"` when `errorText` exists;
- back action `กลับหน้าหลัก` calling `router.push('/')`;
- no sign-up, forgot-password, OAuth, or guest controls.

Use existing Elegant Dark visual language only; do not introduce a new design system.

- [ ] **Step 4: Add thin `/login` route**

Create `app/login/page.tsx`:

```tsx
import { LoginView } from '@/components/v11/components/auth/LoginView'

export default function LoginPage() {
  return <LoginView />
}
```

- [ ] **Step 5: Run focused tests**

```bash
pnpm vitest run tests/v11-auth-flow.test.tsx
```

Expected: Login tests PASS.

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

- [ ] **Step 1: Write failing guard tests**

Mock `getCurrentSession` and `subscribeToAuthChanges`. Cover:

```tsx
it('redirects unauthenticated chat before protected children mount', async () => {
  getSessionMock.mockResolvedValue({ status: 'unauthenticated' })
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
  render(<RequireAuth><div>protected chat</div></RequireAuth>)
  expect(await screen.findByText('protected chat')).toBeInTheDocument()
})
```

Add a test where the subscription listener receives `false` after mount and expects redirect to `/login?next=/chat`.

- [ ] **Step 2: Confirm RED**

```bash
pnpm vitest run tests/v11-auth-flow.test.tsx
```

Expected: FAIL because `RequireAuth` does not exist.

- [ ] **Step 3: Implement RequireAuth**

Create a client component with state `'checking' | 'authenticated' | 'unauthenticated'`.

Core shape:

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
      if (session.status === 'authenticated') setState('authenticated')
      else {
        setState('unauthenticated')
        router.push('/login?next=/chat')
      }
    })

    const unsubscribe = subscribeToAuthChanges((authenticated) => {
      if (!active) return
      if (authenticated) setState('authenticated')
      else {
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

Do not render `SmartChatView`, the composer, or pending-prompt effects while checking/unauthenticated.

- [ ] **Step 4: Wrap the Chat route**

Modify `app/chat/page.tsx` to:

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

- [ ] **Step 5: Run focused tests**

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

### Task 4: Make the landing Login action real and preserve prompt handoff

**Files:**
- Modify: `components/v11/V11Landing.tsx`
- Modify: `components/v11/components/landing/HeroSection.tsx`
- Modify/Test: `tests/v11-auth-flow.test.tsx`
- Regression: `tests/v11-live-smart-chat.test.tsx`

**Interfaces:**
- Produces: `HeroSection` accepts `onLoginClick: () => void` and shows active `เข้าสู่ระบบ` button.
- Consumes: existing `setPendingPrompt()` and `routeToPath.smart_chat` behavior.

- [ ] **Step 1: Write failing landing-login test**

Render `V11Landing`, click `เข้าสู่ระบบ`, and expect:

```tsx
expect(pushMock).toHaveBeenCalledWith('/login?next=/chat')
```

Retain the existing landing composer regression:

```tsx
fireEvent.change(screen.getByPlaceholderText(/พิมพ์ข้อความ/), {
  target: { value: 'ถามจากหน้าแรก' },
})
fireEvent.click(screen.getByRole('button', { name: 'ส่งข้อความ' }))
expect(peekPendingPrompt()).toBe('ถามจากหน้าแรก')
expect(pushMock).toHaveBeenCalledWith('/chat')
```

This proves the prompt remains in session storage while `RequireAuth` decides whether login is required.

- [ ] **Step 2: Confirm RED for the login action**

```bash
pnpm vitest run tests/v11-auth-flow.test.tsx tests/v11-live-smart-chat.test.tsx
```

Expected: new login-action assertion FAIL because the Hero button is still disabled preview copy.

- [ ] **Step 3: Wire V11Landing login navigation**

In `V11Landing.tsx`, add:

```tsx
const handleLogin = () => router.push('/login?next=/chat')
```

Pass it to Hero:

```tsx
<HeroSection onStartClick={handleStart} onLoginClick={handleLogin} />
```

- [ ] **Step 4: Replace disabled Hero login preview**

Change the prop interface:

```ts
interface HeroSectionProps {
  onStartClick: () => void
  onLoginClick: () => void
}
```

Replace the disabled button with:

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
- Produces: Runtime adapter no longer owns a second Supabase client; Chat 401 causes prompt preservation + session clear + login navigation and never renders the unauthenticated text as a successful assistant answer.

- [ ] **Step 1: Write failing adapter-sharing test**

Mock `getCurrentSession()` to return `{ status: 'authenticated', accessToken: 'user-token' }`, stub `fetch`, call the default Chat sender path, and assert `/api/chat` receives:

```ts
expect(fetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
  method: 'POST',
  headers: expect.objectContaining({
    authorization: 'Bearer user-token',
  }),
}))
```

Also test that `getCurrentSession()` returning `unauthenticated` or `unavailable` does not call `fetch` and returns `UNAUTHENTICATED` from `GatewayRuntimeAdapter.executePrompt`.

- [ ] **Step 2: Write failing stale-session Chat recovery test**

In a component test, mock:

```ts
vi.spyOn(defaultRuntimeAdapter, 'executePrompt').mockResolvedValue({
  status: 'UNAUTHENTICATED',
  message: 'กรุณาเข้าสู่ระบบ',
})
```

Type `งานที่ยังไม่สำเร็จ`, submit, then assert:

```tsx
await waitFor(() => expect(peekPendingPrompt()).toBe('งานที่ยังไม่สำเร็จ'))
expect(clearSessionMock).toHaveBeenCalledTimes(1)
expect(pushMock).toHaveBeenCalledWith('/login?next=/chat')
expect(screen.queryByText('กรุณาเข้าสู่ระบบ')).not.toBeInTheDocument()
```

The exact unsatisfied prompt must be stored before leaving Chat.

- [ ] **Step 3: Confirm RED**

```bash
pnpm vitest run tests/v11-live-smart-chat.test.tsx tests/v11-auth-flow.test.tsx
```

Expected: FAIL because runtimeAdapter still owns `createClient` and SmartChatView currently treats every adapter message as displayable output.

- [ ] **Step 4: Refactor runtimeAdapter to use browserAuth**

Remove:

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
let browserSupabase: SupabaseClient | null = null
function getBrowserSupabase() { ... }
```

Replace with:

```ts
import { getCurrentSession } from './browserAuth'
```

Inside the authenticated sender:

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

Keep the existing verified-response contract and provider-neutral extraction unchanged. Do not alter non-Chat capability behavior in this milestone.

Update user-facing unauthenticated adapter copy to remove the stale `Smart Chat`/`Live` wording, for example:

```ts
return {
  status: 'UNAUTHENTICATED',
  message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน Chat',
}
```

- [ ] **Step 5: Handle UNAUTHENTICATED in SmartChatView before rendering**

Add imports:

```tsx
import { useRouter } from 'next/navigation'
import { clearBrowserSession } from '../../services/browserAuth'
import { clearPendingPrompt, peekPendingPrompt, setPendingPrompt } from '../../services/promptHandoff'
```

Create router inside the component:

```tsx
const router = useRouter()
```

Immediately after `executePrompt` returns and after the abort check, handle auth failure before creating/displaying the result text:

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

The user message may remain visible briefly until route navigation, but the empty assistant placeholder must be removed and the adapter's unauthenticated copy must not render as a successful assistant response.

Include `router` in the callback dependency list.

- [ ] **Step 6: Run focused auth + Chat tests**

```bash
pnpm vitest run tests/v11-auth-flow.test.tsx tests/v11-live-smart-chat.test.tsx
```

Expected: PASS, including prompt preservation and no fake assistant answer on 401.

- [ ] **Step 7: Run all unit/component tests**

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
- No planned production-code changes unless verification exposes a defect directly in this milestone.
- Review: all Task 1-5 files.

**Interfaces:**
- Consumes: completed auth flow from Tasks 1-5.
- Produces: evidence that the branch is safe for Preview review; does not authorize Production.

- [ ] **Step 1: Run the repository's complete verification command**

Run from `lsuperagent-pro`:

```bash
pnpm verify
```

Expected sequence, all exit code 0:
- `pnpm guard:secrets`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

Do not claim completion from an earlier CI run; use a fresh run from the final implementation commit.

- [ ] **Step 2: Inspect the final diff for scope creep and secrets**

Run:

```bash
git diff main...HEAD -- app/login app/chat components/v11/components/auth components/v11/components/chat components/v11/components/landing components/v11/services tests
```

Confirm:
- no service-role/provider keys;
- no direct browser -> provider calls;
- no changes to Research/Image/Agent/Memory execution;
- no signup/reset/OAuth additions;
- `/api/chat` remains the same-origin boundary.

- [ ] **Step 3: Push branch and wait for GitHub/Vercel Preview checks**

Push only the feature branch. Confirm both repository verification workflows pass on the final head and Vercel reports a successful Preview deployment. Do not merge `main`.

- [ ] **Step 4: Verify unauthenticated mobile flow at 393 x 852**

In the Preview at exactly 393 x 852:

1. Clear the browser Supabase session.
2. Open `/chat` directly.
3. Confirm Chat UI never flashes/mounts before redirect.
4. Confirm destination is `/login?next=/chat`.
5. Confirm Login is single-column, no horizontal overflow, labels visible, touch targets at least 44px.
6. Submit known-invalid credentials and confirm only `อีเมลหรือรหัสผ่านไม่ถูกต้อง` appears.
7. Confirm no `/api/chat` provider-bound request occurs while unauthenticated.

- [ ] **Step 5: Verify authenticated prompt handoff at 393 x 852**

Using a valid Supabase email/password account already provisioned outside this implementation:

1. Sign out.
2. Return to `/`.
3. Type a unique prompt such as `AUTH-HANDOFF-393-852` in the landing composer.
4. Submit.
5. Confirm login gate appears before Chat execution.
6. Sign in successfully.
7. Confirm `/chat` opens and the exact prompt is delivered once, not zero or twice.
8. Confirm the network request is `POST /api/chat` with a Bearer user token and no provider credential in browser traffic.

Do not paste or commit real credentials into tests, docs, issues, or logs.

- [ ] **Step 6: Verify stale-session/401 behavior**

With a deliberately expired/invalid local session or a controlled test path that makes `/api/chat` return 401:

1. Type a unique prompt.
2. Submit.
3. Confirm no assistant success is rendered.
4. Confirm navigation returns to `/login?next=/chat`.
5. Sign in again.
6. Confirm the preserved prompt is delivered exactly once.

- [ ] **Step 7: Record Preview evidence and stop at the production gate**

Report:
- final branch head SHA;
- fresh R1/R2 workflow conclusions;
- Vercel Preview status/link if available;
- 393 x 852 acceptance result;
- auth/prompt-handoff/401 results;
- any downstream runtime limitation separately from auth readiness.

Explicitly state: **Production remains unchanged. Merge/deploy requires separate user approval.**

---

## Self-review result

- Spec coverage: Login, guard-before-mount, shared Supabase client, safe `next`, landing prompt preservation, direct `/chat`, runtime 401 recovery, fail-closed behavior, mobile verification, and production gate are all mapped to tasks above.
- Placeholder scan: no TODO/TBD/"implement later" steps are present.
- Type consistency: Task 1 defines the exact auth-service exports consumed by Tasks 2, 3, and 5.
- Scope: one subsystem only — email/password authentication for Chat. No package, database, provider, or other capability work is required.
