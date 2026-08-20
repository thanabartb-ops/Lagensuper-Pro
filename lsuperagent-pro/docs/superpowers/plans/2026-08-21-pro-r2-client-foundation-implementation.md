# LSUPERAGENT PRO-R2 Client Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the verified PRO-R1 shell into a navigable LSUPERAGENT PRO alternate-client foundation with explicit connection-state semantics and a provider-neutral thin gateway contract, without introducing a second core, runtime, gateway authority, memory authority, audit authority, provider call, Supabase mutation, or deployment.

**Architecture:** The browser renders a shared application shell and seven client-only module pages. A provider-neutral `lib/gateway` layer models the existing Trusted LSUPERAGENT Gateway but remains fail-closed and `NOT_CONNECTED` in PRO-R2; `/api/health` remains the only server route. No privileged execution or canonical data mutation is implemented.

**Tech Stack:** Next.js 16.3.1 App Router, React 19.2.8, TypeScript 5.x, Tailwind CSS 4.x, pnpm 10.34.5, Vitest 4.1.11, Testing Library, lucide-react, clsx, tailwind-merge.

**Spec:** `lsuperagent-pro/docs/superpowers/specs/2026-08-20-pro-r2-client-foundation-design.md`

## Global Constraints

- LSUPERAGENT PRO remains an alternate client only.
- `ConnectionStatus` is exactly `'NOT_CONNECTED' | 'CONNECTED' | 'DEGRADED' | 'BLOCKED'`.
- The default gateway/backend status is `NOT_CONNECTED` until later verified live connectivity exists.
- `/api/health` remains the only implemented server route in PRO-R2.
- Do not add `/api/chat`, `/api/execute`, `/api/memory`, `/api/memory/candidate`, `/api/tools`, or `/api/audit`.
- Do not perform provider API calls, privileged tool execution, canonical memory writes, canonical audit writes, live Supabase mutations, Vercel deployment, production deployment, domain changes, or DNS changes.
- Public environment variables remain exactly `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_APP_ENV=preview`.
- No browser-visible privileged secret name or value may be introduced.
- All placeholder/unavailable module data must be labeled unavailable or not connected; never present mock data as canonical.
- Implementation changes are restricted to `lsuperagent-pro/` plus a read-only GitHub Actions verification workflow used only for evidence.

---

## File Structure

### Create

- `lsuperagent-pro/lib/gateway/types.ts` — provider-neutral connection/request/response contracts.
- `lsuperagent-pro/lib/gateway/client.ts` — fail-closed thin gateway adapter for PRO-R2.
- `lsuperagent-pro/components/common/StatusBadge.tsx` — renders all four connection states.
- `lsuperagent-pro/components/common/Card.tsx` — shared visual container.
- `lsuperagent-pro/components/shell/nav-items.ts` — single navigation source of truth.
- `lsuperagent-pro/components/shell/Sidebar.tsx` — desktop navigation.
- `lsuperagent-pro/components/shell/MobileNav.tsx` — mobile navigation.
- `lsuperagent-pro/components/shell/Header.tsx` — identity/status header.
- `lsuperagent-pro/components/shell/AppShell.tsx` — composes shell around route content.
- `lsuperagent-pro/components/modules/ModuleStatusPage.tsx` — shared minimal unavailable/not-connected module presentation.
- `lsuperagent-pro/app/chat/page.tsx`
- `lsuperagent-pro/app/projects/page.tsx`
- `lsuperagent-pro/app/memory/page.tsx`
- `lsuperagent-pro/app/tools/page.tsx`
- `lsuperagent-pro/app/runtime/page.tsx`
- `lsuperagent-pro/app/audit/page.tsx`
- `lsuperagent-pro/app/settings/page.tsx`
- `lsuperagent-pro/tests/pro-r2-gateway.test.ts`
- `lsuperagent-pro/tests/pro-r2-shell.test.tsx`
- `lsuperagent-pro/tests/pro-r2-routes.test.ts`
- `.github/workflows/pro-r2-verify.yml` — read-only PR verification.

### Modify

- `lsuperagent-pro/app/layout.tsx` — wrap pages with `AppShell`; preserve explicit `ReactNode` typing.
- `lsuperagent-pro/app/page.tsx` — convert landing page to client-foundation dashboard using shared components.
- `lsuperagent-pro/tests/pro-r1.test.tsx` — preserve R1 contract; only adjust selectors if shell composition creates duplicate text.

### Preserve unchanged unless a failing test proves otherwise

- `lsuperagent-pro/app/api/health/route.ts`
- `lsuperagent-pro/.env.example`
- `lsuperagent-pro/package.json`
- `lsuperagent-pro/pnpm-lock.yaml`

---

### Task 1: Provider-neutral gateway and connection-status primitives

**Files:**
- Create: `lsuperagent-pro/lib/gateway/types.ts`
- Create: `lsuperagent-pro/lib/gateway/client.ts`
- Create: `lsuperagent-pro/components/common/StatusBadge.tsx`
- Create: `lsuperagent-pro/components/common/Card.tsx`
- Test: `lsuperagent-pro/tests/pro-r2-gateway.test.ts`

**Interfaces:**
- Produces: `ConnectionStatus`, `GatewayErrorLayer`, `TrustedGatewayRequest<TPayload>`, `TrustedGatewayResponse<T>`, `GatewaySnapshot`, `getGatewaySnapshot()`, `requestTrustedGateway<T>()`, `StatusBadge`, and `Card`.
- Consumes: no later-task interfaces.

- [ ] **Step 1: Write the failing gateway/status contract test**

Create `tests/pro-r2-gateway.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getGatewaySnapshot, requestTrustedGateway } from '../lib/gateway/client'
import type { ConnectionStatus } from '../lib/gateway/types'

const allStatuses: ConnectionStatus[] = [
  'NOT_CONNECTED',
  'CONNECTED',
  'DEGRADED',
  'BLOCKED',
]

describe('PRO-R2 gateway contract', () => {
  it('exposes exactly the four approved connection states', () => {
    expect(allStatuses).toEqual([
      'NOT_CONNECTED',
      'CONNECTED',
      'DEGRADED',
      'BLOCKED',
    ])
  })

  it('defaults gateway and backend to NOT_CONNECTED', () => {
    expect(getGatewaySnapshot()).toEqual({
      gateway: 'NOT_CONNECTED',
      backend: 'NOT_CONNECTED',
    })
  })

  it('fails closed without performing privileged network execution', async () => {
    const response = await requestTrustedGateway({
      endpoint: '/not-enabled-in-pro-r2',
      payload: { example: true },
    })

    expect(response).toEqual({
      status: 'not_connected',
      errorLayer: 'GATEWAY_ERROR',
      message: 'Trusted gateway execution is not connected in PRO-R2.',
    })
  })
})
```

- [ ] **Step 2: Run the focused test and record RED**

Run:

```bash
cd lsuperagent-pro
pnpm vitest run tests/pro-r2-gateway.test.ts
```

Expected: FAIL because `../lib/gateway/client` and `../lib/gateway/types` do not exist.

- [ ] **Step 3: Implement the provider-neutral types**

Create `lib/gateway/types.ts`:

```ts
export type ConnectionStatus =
  | 'NOT_CONNECTED'
  | 'CONNECTED'
  | 'DEGRADED'
  | 'BLOCKED'

export type GatewayErrorLayer =
  | 'UI_ERROR'
  | 'AUTH_ERROR'
  | 'GATEWAY_ERROR'
  | 'POLICY_ERROR'
  | 'MEMORY_ERROR'
  | 'TOOL_ERROR'
  | 'MODEL_ERROR'
  | 'AUDIT_ERROR'
  | 'DATABASE_ERROR'

export interface TrustedGatewayRequest<TPayload = unknown> {
  endpoint: string
  payload: TPayload
  userAuthToken?: string
}

export interface TrustedGatewayResponse<T = unknown> {
  status: 'verified' | 'blocked' | 'failed' | 'not_connected'
  data?: T
  executionId?: string
  errorLayer?: GatewayErrorLayer
  message?: string
}

export interface GatewaySnapshot {
  gateway: ConnectionStatus
  backend: ConnectionStatus
}
```

- [ ] **Step 4: Implement the fail-closed thin gateway client**

Create `lib/gateway/client.ts`:

```ts
import type {
  GatewaySnapshot,
  TrustedGatewayRequest,
  TrustedGatewayResponse,
} from './types'

export function getGatewaySnapshot(): GatewaySnapshot {
  return {
    gateway: 'NOT_CONNECTED',
    backend: 'NOT_CONNECTED',
  }
}

export async function requestTrustedGateway<T = unknown>(
  _request: TrustedGatewayRequest,
): Promise<TrustedGatewayResponse<T>> {
  return {
    status: 'not_connected',
    errorLayer: 'GATEWAY_ERROR',
    message: 'Trusted gateway execution is not connected in PRO-R2.',
  }
}
```

The unused `_request` parameter is intentional: the adapter accepts the future contract without making a network call in PRO-R2.

- [ ] **Step 5: Implement shared status/card components**

Create `components/common/StatusBadge.tsx`:

```tsx
import clsx from 'clsx'
import type { ConnectionStatus } from '@/lib/gateway/types'

const styles: Record<ConnectionStatus, string> = {
  NOT_CONNECTED: 'border-zinc-700 bg-zinc-900 text-zinc-300',
  CONNECTED: 'border-emerald-700/60 bg-emerald-950/40 text-emerald-300',
  DEGRADED: 'border-amber-700/60 bg-amber-950/40 text-amber-300',
  BLOCKED: 'border-rose-700/60 bg-rose-950/40 text-rose-300',
}

export function StatusBadge({ status }: { status: ConnectionStatus }) {
  return (
    <span
      className={clsx(
        'inline-flex rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide',
        styles[status],
      )}
    >
      {status}
    </span>
  )
}
```

Create `components/common/Card.tsx`:

```tsx
import type { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

export function Card({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={twMerge(
        'rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5',
        className,
      )}
    >
      {children}
    </section>
  )
}
```

- [ ] **Step 6: Run focused test and TypeScript**

Run:

```bash
pnpm vitest run tests/pro-r2-gateway.test.ts
pnpm exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 7: Commit Task 1**

```bash
git add lsuperagent-pro/lib/gateway lsuperagent-pro/components/common lsuperagent-pro/tests/pro-r2-gateway.test.ts
git commit -m "feat(pro-r2): add fail-closed gateway contracts"
```

---

### Task 2: Shared application shell and navigation

**Files:**
- Create: `lsuperagent-pro/components/shell/nav-items.ts`
- Create: `lsuperagent-pro/components/shell/Sidebar.tsx`
- Create: `lsuperagent-pro/components/shell/MobileNav.tsx`
- Create: `lsuperagent-pro/components/shell/Header.tsx`
- Create: `lsuperagent-pro/components/shell/AppShell.tsx`
- Modify: `lsuperagent-pro/app/layout.tsx`
- Test: `lsuperagent-pro/tests/pro-r2-shell.test.tsx`

**Interfaces:**
- Consumes: `ConnectionStatus`, `getGatewaySnapshot()`, `StatusBadge` from Task 1.
- Produces: `navItems`, `AppShell`, and discoverable links to all seven approved module destinations.

- [ ] **Step 1: Write the failing shell/navigation test**

Create `tests/pro-r2-shell.test.tsx`:

```tsx
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { AppShell } from '../components/shell/AppShell'

const expectedLinks = [
  ['Chat', '/chat'],
  ['Projects', '/projects'],
  ['Memory', '/memory'],
  ['Tools', '/tools'],
  ['Runtime', '/runtime'],
  ['Audit', '/audit'],
  ['Settings', '/settings'],
] as const

afterEach(() => cleanup())

describe('PRO-R2 application shell', () => {
  it('renders LSUPERAGENT PRO identity and all module destinations', () => {
    render(
      <AppShell>
        <p>Route content</p>
      </AppShell>,
    )

    expect(screen.getByText('LSUPERAGENT PRO')).toBeInTheDocument()
    expect(screen.getAllByText('NOT_CONNECTED').length).toBeGreaterThan(0)

    for (const [label, href] of expectedLinks) {
      const links = screen.getAllByRole('link', { name: label })
      expect(links.some((link) => link.getAttribute('href') === href)).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Run focused test and record RED**

```bash
pnpm vitest run tests/pro-r2-shell.test.tsx
```

Expected: FAIL because `components/shell/AppShell` does not exist.

- [ ] **Step 3: Create the navigation source of truth**

Create `components/shell/nav-items.ts`:

```ts
import {
  Bot,
  Boxes,
  Brain,
  FileClock,
  Gauge,
  Settings,
  Wrench,
} from 'lucide-react'

export const navItems = [
  { label: 'Chat', href: '/chat', icon: Bot },
  { label: 'Projects', href: '/projects', icon: Boxes },
  { label: 'Memory', href: '/memory', icon: Brain },
  { label: 'Tools', href: '/tools', icon: Wrench },
  { label: 'Runtime', href: '/runtime', icon: Gauge },
  { label: 'Audit', href: '/audit', icon: FileClock },
  { label: 'Settings', href: '/settings', icon: Settings },
] as const
```

- [ ] **Step 4: Implement desktop and mobile navigation**

Create `components/shell/Sidebar.tsx`:

```tsx
import Link from 'next/link'
import { navItems } from './nav-items'

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-zinc-800 bg-black/70 p-4 md:block">
      <nav aria-label="Primary navigation" className="space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white"
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
```

Create `components/shell/MobileNav.tsx`:

```tsx
import Link from 'next/link'
import { navItems } from './nav-items'

export function MobileNav() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="grid grid-cols-4 gap-1 border-t border-zinc-800 bg-black/95 p-2 md:hidden"
    >
      {navItems.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] text-zinc-400 hover:bg-zinc-900 hover:text-white"
        >
          <Icon aria-hidden="true" className="size-4" />
          <span className="truncate">{label}</span>
        </Link>
      ))}
    </nav>
  )
}
```

- [ ] **Step 5: Implement the header and shell composition**

Create `components/shell/Header.tsx`:

```tsx
import { StatusBadge } from '@/components/common/StatusBadge'
import { getGatewaySnapshot } from '@/lib/gateway/client'

export function Header() {
  const { gateway } = getGatewaySnapshot()

  return (
    <header className="flex min-h-16 items-center justify-between gap-4 border-b border-zinc-800 bg-black/70 px-4 sm:px-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Alternate Client</p>
        <p className="font-semibold tracking-tight text-white">LSUPERAGENT PRO</p>
      </div>
      <StatusBadge status={gateway} />
    </header>
  )
}
```

Create `components/shell/AppShell.tsx`:

```tsx
import type { ReactNode } from 'react'
import { Header } from './Header'
import { MobileNav } from './MobileNav'
import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 py-6 pb-24 sm:px-6 md:pb-6">
          {children}
        </main>
      </div>
      <div className="fixed inset-x-0 bottom-0 md:hidden">
        <MobileNav />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Wrap all pages in the shell without reintroducing generated `LayoutProps`**

Modify `app/layout.tsx` so the existing explicit `ReactNode` typing remains and the body becomes:

```tsx
import { AppShell } from '@/components/shell/AppShell'

// existing font + metadata definitions remain

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
```

- [ ] **Step 7: Run shell test, R1 regression test, lint, and TypeScript**

```bash
pnpm vitest run tests/pro-r2-shell.test.tsx tests/pro-r1.test.tsx
pnpm lint
pnpm exec tsc --noEmit
```

Expected: PASS. If the R1 test sees multiple `NOT_CONNECTED` elements because the shell adds a header badge, change only that R1 assertion from `getByText('NOT_CONNECTED')` to `getAllByText('NOT_CONNECTED').length > 0`; do not weaken the identity or environment assertions.

- [ ] **Step 8: Commit Task 2**

```bash
git add lsuperagent-pro/components/shell lsuperagent-pro/app/layout.tsx lsuperagent-pro/tests/pro-r2-shell.test.tsx lsuperagent-pro/tests/pro-r1.test.tsx
git commit -m "feat(pro-r2): add responsive client navigation shell"
```

---

### Task 3: Minimal module pages and client-foundation dashboard

**Files:**
- Create: `lsuperagent-pro/components/modules/ModuleStatusPage.tsx`
- Create: `lsuperagent-pro/app/chat/page.tsx`
- Create: `lsuperagent-pro/app/projects/page.tsx`
- Create: `lsuperagent-pro/app/memory/page.tsx`
- Create: `lsuperagent-pro/app/tools/page.tsx`
- Create: `lsuperagent-pro/app/runtime/page.tsx`
- Create: `lsuperagent-pro/app/audit/page.tsx`
- Create: `lsuperagent-pro/app/settings/page.tsx`
- Modify: `lsuperagent-pro/app/page.tsx`
- Test: `lsuperagent-pro/tests/pro-r2-routes.test.ts`

**Interfaces:**
- Consumes: `Card`, `StatusBadge`, `getGatewaySnapshot()`.
- Produces: seven minimal App Router destinations and a home dashboard; none perform network/provider/privileged operations.

- [ ] **Step 1: Write the failing route/scope contract test**

Create `tests/pro-r2-routes.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const modulePages = [
  'chat',
  'projects',
  'memory',
  'tools',
  'runtime',
  'audit',
  'settings',
] as const

const prohibitedServerRoutes = [
  'app/api/chat/route.ts',
  'app/api/execute/route.ts',
  'app/api/memory/route.ts',
  'app/api/memory/candidate/route.ts',
  'app/api/tools/route.ts',
  'app/api/audit/route.ts',
] as const

describe('PRO-R2 route and authority boundary', () => {
  it('contains all seven approved module pages', () => {
    for (const page of modulePages) {
      expect(existsSync(resolve(process.cwd(), `app/${page}/page.tsx`))).toBe(true)
    }
  })

  it('keeps /api/health as the only implemented PRO-R2 server route', () => {
    expect(existsSync(resolve(process.cwd(), 'app/api/health/route.ts'))).toBe(true)
    for (const route of prohibitedServerRoutes) {
      expect(existsSync(resolve(process.cwd(), route))).toBe(false)
    }
  })

  it('does not introduce privileged secret names in app or lib source', () => {
    const forbidden = [
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY',
      'GEMINI_API_KEY',
      'GITHUB_TOKEN',
      'VERCEL_TOKEN',
    ]

    const sources = [
      'app/page.tsx',
      'lib/gateway/client.ts',
      'lib/gateway/types.ts',
    ]
      .map((path) => readFileSync(resolve(process.cwd(), path), 'utf8'))
      .join('\n')

    for (const name of forbidden) {
      expect(sources).not.toContain(name)
    }
  })
})
```

- [ ] **Step 2: Run focused test and record RED**

```bash
pnpm vitest run tests/pro-r2-routes.test.ts
```

Expected: FAIL because the seven module page files do not exist.

- [ ] **Step 3: Implement shared minimal module presentation**

Create `components/modules/ModuleStatusPage.tsx`:

```tsx
import { Card } from '@/components/common/Card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { getGatewaySnapshot } from '@/lib/gateway/client'

export function ModuleStatusPage({
  title,
  description,
}: {
  title: string
  description: string
}) {
  const { gateway } = getGatewaySnapshot()

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">LSUPERAGENT PRO</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{description}</p>
      </div>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Trusted gateway</p>
            <p className="mt-1 text-sm text-zinc-500">Live canonical data is unavailable in PRO-R2.</p>
          </div>
          <StatusBadge status={gateway} />
        </div>
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: Create the seven module pages**

Use these exact exports:

`app/chat/page.tsx`:

```tsx
import { ModuleStatusPage } from '@/components/modules/ModuleStatusPage'

export default function ChatPage() {
  return <ModuleStatusPage title="Chat" description="Conversation shell only. No model request is sent in PRO-R2." />
}
```

`app/projects/page.tsx`:

```tsx
import { ModuleStatusPage } from '@/components/modules/ModuleStatusPage'

export default function ProjectsPage() {
  return <ModuleStatusPage title="Projects" description="Project view foundation only. No remote project mutation is enabled in PRO-R2." />
}
```

`app/memory/page.tsx`:

```tsx
import { ModuleStatusPage } from '@/components/modules/ModuleStatusPage'

export default function MemoryPage() {
  return <ModuleStatusPage title="Memory" description="Canonical memory remains owned by the existing LSUPERAGENT core. No memory read/write wiring is enabled here." />
}
```

`app/tools/page.tsx`:

```tsx
import { ModuleStatusPage } from '@/components/modules/ModuleStatusPage'

export default function ToolsPage() {
  return <ModuleStatusPage title="Tools" description="Tool registry presentation only. Privileged tool execution is not enabled in PRO-R2." />
}
```

`app/runtime/page.tsx`:

```tsx
import { ModuleStatusPage } from '@/components/modules/ModuleStatusPage'

export default function RuntimePage() {
  return <ModuleStatusPage title="Runtime" description="Runtime status presentation only. The existing trusted runtime remains authoritative." />
}
```

`app/audit/page.tsx`:

```tsx
import { ModuleStatusPage } from '@/components/modules/ModuleStatusPage'

export default function AuditPage() {
  return <ModuleStatusPage title="Audit" description="Canonical audit remains external to this client. No audit query or write wiring is enabled in PRO-R2." />
}
```

`app/settings/page.tsx`:

```tsx
import { ModuleStatusPage } from '@/components/modules/ModuleStatusPage'

export default function SettingsPage() {
  return <ModuleStatusPage title="Settings" description="Client presentation settings only. Secrets are not stored by this page." />
}
```

- [ ] **Step 5: Convert the home page to a status dashboard using shared contracts**

Replace `app/page.tsx` with:

```tsx
import { Card } from '@/components/common/Card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { getGatewaySnapshot } from '@/lib/gateway/client'

export default function Home() {
  const snapshot = getGatewaySnapshot()

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Alternate Client</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">LSUPERAGENT PRO</h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          Thin client for the existing trusted LSUPERAGENT gateway. No parallel core, memory, audit, or runtime authority is created here.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-zinc-500">Trusted gateway</p>
          <div className="mt-3"><StatusBadge status={snapshot.gateway} /></div>
        </Card>
        <Card>
          <p className="text-sm text-zinc-500">Canonical backend</p>
          <div className="mt-3"><StatusBadge status={snapshot.backend} /></div>
        </Card>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Run route, shell, gateway, and R1 regression tests**

```bash
pnpm vitest run
pnpm lint
pnpm exec tsc --noEmit
```

Expected: all tests and checks PASS.

- [ ] **Step 7: Commit Task 3**

```bash
git add lsuperagent-pro/app lsuperagent-pro/components/modules lsuperagent-pro/tests/pro-r2-routes.test.ts
git commit -m "feat(pro-r2): add not-connected module foundations"
```

---

### Task 4: Read-only verification workflow and final release evidence

**Files:**
- Create: `.github/workflows/pro-r2-verify.yml`
- No production application behavior change is allowed in this task.

**Interfaces:**
- Consumes all Task 1–3 source and tests.
- Produces auditable PR-triggered CI evidence only.

- [ ] **Step 1: Create the read-only verification workflow**

Create `.github/workflows/pro-r2-verify.yml`:

```yaml
name: LSUPERAGENT PRO R2 Verify

on:
  pull_request:
    branches:
      - main
    paths:
      - 'lsuperagent-pro/**'
      - '.github/workflows/pro-r2-verify.yml'

permissions:
  contents: read

jobs:
  verify:
    name: PRO-R2 client foundation verification
    runs-on: ubuntu-latest
    timeout-minutes: 20
    defaults:
      run:
        working-directory: lsuperagent-pro

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install frozen dependencies
        run: pnpm install --frozen-lockfile

      - name: Verify environment contract
        shell: bash
        run: |
          set -euo pipefail
          test -f .env.example
          mapfile -t vars < <(grep -vE '^\s*(#|$)' .env.example | cut -d= -f1)
          expected=(
            NEXT_PUBLIC_SUPABASE_URL
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
            NEXT_PUBLIC_APP_ENV
          )
          test "${#vars[@]}" -eq "${#expected[@]}"
          for i in "${!expected[@]}"; do
            test "${vars[$i]}" = "${expected[$i]}"
          done
          test "$(grep '^NEXT_PUBLIC_APP_ENV=' .env.example)" = 'NEXT_PUBLIC_APP_ENV=preview'

      - name: Verify prohibited server routes are absent
        shell: bash
        run: |
          set -euo pipefail
          test -f app/api/health/route.ts
          prohibited=(
            app/api/chat/route.ts
            app/api/execute/route.ts
            app/api/memory/route.ts
            app/api/memory/candidate/route.ts
            app/api/tools/route.ts
            app/api/audit/route.ts
          )
          for route in "${prohibited[@]}"; do
            test ! -e "$route"
          done

      - name: Secret-name scan
        shell: bash
        run: |
          set -euo pipefail
          if grep -RIE '(SUPABASE_SERVICE_ROLE_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|GEMINI_API_KEY|GITHUB_TOKEN|VERCEL_TOKEN|sk-[A-Za-z0-9_-]{12,})' app components lib tests .env.example; then
            echo 'Forbidden privileged secret name or token-like value detected.' >&2
            exit 1
          fi

      - name: Vitest
        run: pnpm vitest run

      - name: Lint
        run: pnpm lint

      - name: TypeScript
        run: pnpm exec tsc --noEmit

      - name: Production build
        run: pnpm build
```

- [ ] **Step 2: Run the complete local/runner verification sequence before committing the workflow**

```bash
cd lsuperagent-pro
pnpm install --frozen-lockfile
pnpm vitest run
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Expected: every command exits 0.

- [ ] **Step 3: Perform scope review**

From repository root run:

```bash
git diff --check
git status --short
find lsuperagent-pro/app/api -type f -print | sort
```

Expected server-route list:

```text
lsuperagent-pro/app/api/health/route.ts
```

Review the diff and confirm there is no Supabase schema, Edge Function, provider API, Vercel, domain, DNS, production, memory-authority, audit-authority, or privileged-execution change.

- [ ] **Step 4: Commit the read-only verifier only after source verification passes**

```bash
git add .github/workflows/pro-r2-verify.yml
git commit -m "ci(pro-r2): add read-only client foundation verification"
```

- [ ] **Step 5: Open or update a draft PR and capture PR-triggered CI evidence**

The PR must remain draft during verification and target `main`. Record the workflow run ID, job ID, exact head SHA, and step conclusions for:

```text
Install frozen dependencies
Verify environment contract
Verify prohibited server routes are absent
Secret-name scan
Vitest
Lint
TypeScript
Production build
```

Do not report PRO-R2 verified unless the current-head PR-triggered run concludes `success` and every required step concludes `success`.

- [ ] **Step 6: Produce the final report and STOP**

Use exactly:

```text
STATUS: DONE | DONE_WITH_CONCERNS | BLOCKED
PHASE: PRO-R2_CLIENT_FOUNDATION
BRANCH:
COMMIT_SHA:
RED_TEST_EVIDENCE:
VITEST_RESULT:
LINT_RESULT:
TYPECHECK_RESULT:
BUILD_RESULT:
ENV_CONTRACT_RESULT:
SECRET_SCAN_RESULT:
PARALLEL_GATEWAY_CREATED: NO
PARALLEL_MEMORY_CREATED: NO
PARALLEL_RUNTIME_CREATED: NO
SUPABASE_SCHEMA_CHANGED: NO
DEPLOYMENT_CREATED: NO
PRODUCTION_CHANGED: NO
CONCERNS:
NEXT_GATE: BLOCKED_PENDING_USER_REVIEW
```

STOP after this report. Do not merge the PR and do not begin any live gateway connection, Supabase mutation, provider integration, deployment, domain, DNS, or production phase without a new explicit user approval.
