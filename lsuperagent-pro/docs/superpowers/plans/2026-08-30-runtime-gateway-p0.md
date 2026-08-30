# Runtime Gateway P0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the direct authenticated-user bypass at the Trusted Gateway -> Supabase runtime boundary and make verified Chat execution provider-neutral for Claude without changing the existing Browser -> Lagensuper-Pro -> R3 Gateway contract.

**Architecture:** Keep the current Supabase browser auth and R3 app-to-Gateway HMAC unchanged. Add a distinct server-only `RUNTIME_SHARED_SECRET` on the Gateway -> runtime hop while continuing to require the user's Supabase JWT separately. Make W's runtime validator provider-neutral and mirror the verified runtime provider instead of hard-coding `xai`; then harden the deployed conversation runtime so it fails closed before provider work when Gateway identity is missing.

**Tech Stack:** Next.js 16.3.1, TypeScript 5, Vitest 4.1.11, pnpm 10.34.5, Supabase Edge Functions / Deno, Supabase Auth/Postgres, Vercel Preview.

**Spec:** `lsuperagent-pro/docs/superpowers/specs/2026-08-30-runtime-gateway-p0-design.md`

## Global Constraints

- Scope is LSUPERAGENT V11 Chat path only.
- Keep Browser -> Lagensuper-Pro Supabase auth unchanged.
- Keep the existing R3 signing string, timestamp, nonce, replay behavior, and headers unchanged.
- Use a distinct server-only credential named exactly `RUNTIME_SHARED_SECRET` for Gateway -> runtime authentication.
- Send it only as `x-lsuperagent-runtime-secret`; never expose it through `NEXT_PUBLIC_*`, browser code, logs, responses, fixtures containing real values, or committed secrets.
- Continue to require and validate the user Supabase JWT separately from Gateway identity.
- Gateway verified execution must accept any non-empty provider string when runtime/model/evidence fields are valid.
- Do not enable Deep Research, Image, Agent Mode, or Memory runtime execution in this milestone.
- Do not run a paid Claude E2E until all deterministic security/compatibility gates pass and explicit paid-E2E authorization is received.
- Do not merge to `main`, deploy Production, rotate keys, or perform destructive/database write operations without separate explicit approval.
- Runtime success must not return normal `EXECUTED` when success-metric persistence fails.

---

### Task 1: Create an isolated W Gateway P0 branch and prove RED behavior

**Files:**
- Branch from exact W source commit: `504a0701e08c8b79c808901c3d9aa9127998a39a`
- Modify test: `projects/lsuperagent-control-center/tests/integration/r7-gateway-command-route.test.ts`
- Modify/add focused unit coverage: `projects/lsuperagent-control-center/tests/unit/r7-runtime-command.test.ts`

**Interfaces:**
- Consumes: existing `executeCanonicalCommand(options)` and `POST /api/chat`.
- Produces: failing tests specifying `runtimeSecret`, `x-lsuperagent-runtime-secret`, provider-neutral validation, and top-level provider mirroring.

- [ ] **Step 1: Create branch `agent/lsuperagent-r8-runtime-gateway-p0-v1` from commit `504a0701e08c8b79c808901c3d9aa9127998a39a`.**

- [ ] **Step 2: Add failing integration coverage for the runtime secret and Claude provider.**

Add to `r7-gateway-command-route.test.ts`:

```ts
const runtimeSecret = 'runtime-secret-test-only'

// in afterEach
delete process.env.RUNTIME_SHARED_SECRET

it('fails closed before backend POST when runtime secret is not configured', async () => {
  process.env.LSUPERAGENT_GATEWAY_HMAC_SECRET = secret
  process.env.LSUPERAGENT_GATEWAY_ALLOWED_CLIENTS = clientId
  process.env.LSUPERAGENT_BACKEND_URL =
    'https://example.supabase.co/functions/v1/lsuperagent-conversation-runtime'

  const fetchMock = vi.fn(async () =>
    new Response(JSON.stringify({
      ok: true,
      service: 'lsuperagent-runtime',
      version: '2026.08.30.1',
      database: 'CONNECTED',
      provider: 'claude',
    }), { status: 200, headers: { 'content-type': 'application/json' } }),
  )
  vi.stubGlobal('fetch', fetchMock)

  const response = await POST(signedRequest(true))
  expect(response.status).toBe(503)
  expect(fetchMock).toHaveBeenCalledTimes(1) // health probe only; no backend POST
})

it('forwards server runtime identity and mirrors verified claude provider', async () => {
  process.env.LSUPERAGENT_GATEWAY_HMAC_SECRET = secret
  process.env.LSUPERAGENT_GATEWAY_ALLOWED_CLIENTS = clientId
  process.env.LSUPERAGENT_BACKEND_URL =
    'https://example.supabase.co/functions/v1/lsuperagent-conversation-runtime'
  process.env.RUNTIME_SHARED_SECRET = runtimeSecret

  const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.method === 'GET') {
      return Response.json({
        ok: true,
        service: 'lsuperagent-runtime',
        version: '2026.08.30.1',
        database: 'CONNECTED',
        provider: 'claude',
      })
    }

    const headers = new Headers(init?.headers)
    expect(headers.get('authorization')).toBe(`Bearer ${ownerToken}`)
    expect(headers.get('x-lsuperagent-runtime-secret')).toBe(runtimeSecret)
    expect(String(init?.body)).not.toContain(ownerToken)
    expect(String(init?.body)).not.toContain(runtimeSecret)

    return Response.json({
      status: 'EXECUTED',
      runtime_version: '2026.08.30.1',
      provider: 'claude',
      model: 'claude-sonnet-5',
      output: { text: 'verified chat' },
      evidence: {
        provider_request_id: 'anthropic-request-1',
        correlation_id: 'corr-1',
        qa_run_id: 'qa-1',
      },
    })
  })
  vi.stubGlobal('fetch', fetchMock)

  const response = await POST(signedRequest(true))
  expect(response.status).toBe(200)
  expect(await response.json()).toMatchObject({
    status: 'verified',
    provider: 'claude',
    data: { provider: 'claude' },
  })
})
```

- [ ] **Step 3: Add unit coverage rejecting empty/missing provider while retaining xAI compatibility.**

Create `tests/unit/r7-runtime-command.test.ts` with deterministic `fetchImpl` tests that expect:

```ts
expect(await executeCanonicalCommand({
  backendUrl: 'https://runtime.example.test/chat',
  userAuthToken: 'user-token',
  runtimeSecret: 'runtime-secret-test-only',
  message: 'hello',
  fetchImpl: claudeResponseFetch,
})).toMatchObject({ status: 'verified', data: { provider: 'claude' } })
```

and equivalent valid `provider: 'xai'`, plus invalid `provider: ''` returning `{ status: 'failed' }`.

- [ ] **Step 4: Run the focused tests and verify RED.**

Run from `projects/lsuperagent-control-center`:

```bash
pnpm test:unit -- tests/integration/r7-gateway-command-route.test.ts tests/unit/r7-runtime-command.test.ts
```

Expected: failures caused by missing `runtimeSecret` support, missing runtime-secret header, and current `provider === 'xai'` / top-level `provider: 'xai'` behavior.

- [ ] **Step 5: Commit RED tests.**

```bash
git add tests/integration/r7-gateway-command-route.test.ts tests/unit/r7-runtime-command.test.ts
git commit -m "test: define runtime gateway P0 boundary"
```

---

### Task 2: Implement W provider-neutral Gateway -> runtime identity

**Files:**
- Modify: `projects/lsuperagent-control-center/src/lib/backend/lsuperagent-command.ts`
- Modify: `projects/lsuperagent-control-center/src/app/api/chat/route.ts`
- Modify: `projects/lsuperagent-control-center/.env.example`
- Test: files from Task 1

**Interfaces:**
- Consumes: `RUNTIME_SHARED_SECRET` from server environment.
- Produces: `executeCanonicalCommand({ userAuthToken, runtimeSecret, message, ... })` and a verified `data.provider` string usable by the route.

- [ ] **Step 1: Extend `CommandExecutionOptions` with explicit runtime identity.**

```ts
type CommandExecutionOptions = {
  backendUrl?: string
  userAuthToken: string
  runtimeSecret?: string
  message: string
  fetchImpl?: typeof fetch
  timeoutMs?: number
}
```

Resolve it with:

```ts
const runtimeSecret =
  options.runtimeSecret ?? process.env.RUNTIME_SHARED_SECRET ?? ''

if (!runtimeSecret.trim()) return { status: 'failed' }
```

This check must happen before the runtime POST is issued.

- [ ] **Step 2: Send runtime identity only as a server header.**

Use:

```ts
headers: {
  'content-type': 'application/json',
  authorization: `Bearer ${options.userAuthToken}`,
  'x-lsuperagent-runtime-secret': runtimeSecret,
},
```

Never place the runtime secret in body or response data.

- [ ] **Step 3: Make `validExecution()` provider-neutral and strict.**

Replace the `payload.provider !== 'xai'` check with:

```ts
const provider =
  typeof payload.provider === 'string' ? payload.provider.trim() : ''

if (
  payload.status !== 'EXECUTED' ||
  !provider ||
  typeof payload.runtime_version !== 'string' ||
  !payload.runtime_version.trim() ||
  typeof payload.model !== 'string' ||
  !payload.model.trim() ||
  !isRecord(payload.evidence)
) return false
```

Keep all three evidence IDs mandatory and non-empty.

- [ ] **Step 4: Pass the runtime secret from `/api/chat` and mirror the verified runtime provider.**

Call:

```ts
const execution = await executeCanonicalCommand({
  userAuthToken,
  runtimeSecret: process.env.RUNTIME_SHARED_SECRET ?? '',
  message: chatRequest.input.message,
})
```

For success, derive:

```ts
const provider = String(execution.data.provider).trim()
```

and return:

```ts
{
  requestId: headerRequestId,
  status: 'verified',
  gateway: 'CONNECTED',
  backend: 'CONNECTED',
  provider,
  data: execution.data,
}
```

- [ ] **Step 5: Document only the variable name in `.env.example`.**

Append:

```dotenv
RUNTIME_SHARED_SECRET=
```

Do not add a sample real credential.

- [ ] **Step 6: Run focused tests to GREEN.**

```bash
pnpm test:unit -- tests/integration/r7-gateway-command-route.test.ts tests/unit/r7-runtime-command.test.ts
```

Expected: all focused tests pass, including Claude, xAI, missing secret, empty provider, and R3 owner-auth behavior.

- [ ] **Step 7: Run W full verification.**

```bash
pnpm test:unit
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Expected: all commands exit 0.

- [ ] **Step 8: Commit W implementation.**

```bash
git add src/lib/backend/lsuperagent-command.ts src/app/api/chat/route.ts .env.example tests/
git commit -m "fix: secure provider-neutral runtime gateway"
```

---

### Task 3: Prepare the Supabase conversation runtime P0 revision without Production deployment

**Files / deployment artifact:**
- Existing Supabase Edge Function: `lsuperagent-conversation-runtime`
- Current deployed function version at plan time: `1`
- Current deployed source hash: `4e78e241213c60d361720671bf20ad76499341f3f7af1f21f51f545f65f12698`
- Entrypoint: `index.ts`

**Interfaces:**
- Consumes: `RUNTIME_SHARED_SECRET`, user `Authorization` Bearer token, `x-lsuperagent-runtime-secret`, `{ user_request }`.
- Produces: same runtime response contract with `provider: 'claude'` and evidence IDs.

- [ ] **Step 1: Start from the exact deployed version-1 source; do not create a second runtime function or alternate provider path.**

- [ ] **Step 2: Add a constant-time-capable server-secret comparison helper.**

Use a helper that compares encoded bytes without early length/content disclosure. Required behavior:

```ts
function runtimeSecret(): string {
  return Deno.env.get('RUNTIME_SHARED_SECRET') || ''
}
```

For POST execution:

```ts
const configuredRuntimeSecret = runtimeSecret()
if (!configuredRuntimeSecret) {
  return json({ status: 'FAILED', error: 'RUNTIME_IDENTITY_NOT_CONFIGURED' }, 503)
}

const suppliedRuntimeSecret =
  req.headers.get('x-lsuperagent-runtime-secret') || ''

if (!secureEqual(suppliedRuntimeSecret, configuredRuntimeSecret)) {
  return json({ status: 'BLOCKED', error: 'RUNTIME_IDENTITY_REQUIRED' }, 403)
}
```

This must execute before `authenticatedUser()`, `req.json()`, rate-limit lookup, or `converse()`.

- [ ] **Step 3: Check the actual `metric_events` dependency in health.**

Replace the `auth.admin.listUsers()` reachability proof with a non-mutating query such as:

```ts
const { error } = await admin
  .from('metric_events')
  .select('id', { head: true })
  .limit(1)
```

If that dependency query fails, health returns database error / 503.

- [ ] **Step 4: Make metric persistence part of success integrity.**

Replace the unchecked insert with:

```ts
const { error: metricInsertError } = await admin
  .from('metric_events')
  .insert({ /* existing event fields */ })

if (metricInsertError) {
  return json(
    { status: 'FAILED', correlation_id: correlationId, error: 'METRIC_PERSIST_FAILED' },
    500,
  )
}
```

Only after this check may the function return `EXECUTED`.

- [ ] **Step 5: Narrow CORS without using it as authentication.**

At minimum remove `x-lsuperagent-runtime-secret` from any browser-facing allowed-header need; the server-side Gateway request does not depend on browser preflight. Preserve GET health usability. If an origin allow-list cannot be proven from current deployment config, prefer omitting browser CORS on POST rather than inventing a domain.

- [ ] **Step 6: Prepare deterministic negative probes, but do not send a Claude request.**

After a non-production secured runtime target exists and secrets are configured, verify:

```text
valid user JWT + no runtime secret      -> 403 BLOCKED
valid user JWT + wrong runtime secret   -> 403 BLOCKED
correct runtime secret + invalid JWT    -> 401 BLOCKED
correct secret + valid JWT + bad JSON   -> 400 BLOCKED
```

For every negative probe, confirm no `lsuperagent_conversation_request` success metric is created and no provider execution evidence appears.

- [ ] **Step 7: Stop before deploying this revision to the active/Production Supabase function.**

Deployment of a new version to the active project is a Production/runtime change and requires a separate explicit deploy approval plus server-secret configuration on both sides. Do not infer that approval from code/spec approval.

---

### Task 4: Re-verify Lagensuper-Pro client/server boundary against the secured Gateway contract

**Files:**
- Existing: `lsuperagent-pro/tests/v11-canonical-chat-route.test.ts`
- Existing: `lsuperagent-pro/tests/v11-runtime-auth-boundary.test.ts`
- Existing: `lsuperagent-pro/lib/gateway/server-dispatch.ts`
- Existing: `lsuperagent-pro/app/api/chat/route.ts`

**Interfaces:**
- Consumes: unchanged R3 Gateway contract.
- Produces: proof that no `RUNTIME_SHARED_SECRET` leaks into Lagensuper-Pro browser/client contract and provider-neutral response matching remains strict.

- [ ] **Step 1: Add a source-boundary assertion that `RUNTIME_SHARED_SECRET` is absent from browser/runtimeAdapter code and from `NEXT_PUBLIC_*` contracts.**

The secret belongs to W Gateway and Supabase runtime only; Lagensuper-Pro must never receive it.

- [ ] **Step 2: Retain the existing test that accepts provider-neutral verified execution and rejects top-level/nested provider mismatch.**

No change to R3 signing or `/api/chat` browser request format is allowed.

- [ ] **Step 3: Run focused Chat/Auth tests.**

```bash
pnpm test -- tests/v11-canonical-chat-route.test.ts tests/v11-runtime-auth-boundary.test.ts tests/v11-live-smart-chat.test.tsx tests/v11-auth-flow.test.tsx
```

Expected: all pass.

- [ ] **Step 4: Run the full Lagensuper-Pro gate.**

```bash
pnpm guard:secrets
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Expected: every command exits 0.

- [ ] **Step 5: Commit only if a source/test change was required.**

```bash
git add tests/ lib/ app/ components/
git commit -m "test: lock secured runtime boundary"
```

If existing code already satisfies the contract and no file changes are necessary, record verification evidence instead of creating a no-op commit.

---

### Task 5: Preview/configuration gate and controlled security verification

**Files / environments:**
- W non-production branch: `agent/lsuperagent-r8-runtime-gateway-p0-v1`
- Lagensuper-Pro existing non-production branch: `agent/v11-canonical-live-smart-chat`
- Supabase secured runtime target: must be explicitly identified before deployment

**Interfaces:**
- Consumes: one identical `RUNTIME_SHARED_SECRET` value configured server-side in W Gateway and runtime secret store.
- Produces: negative security evidence and provider-neutral Gateway compatibility evidence without paid provider execution.

- [ ] **Step 1: Generate/store the runtime secret outside source control.**

The user sets the credential in the authorized dashboards/secret stores; never paste it into chat, GitHub, logs, test fixtures, or public environment values.

- [ ] **Step 2: Confirm the exact W Vercel project/team and exact Supabase runtime target before any deployment mutation.**

Do not reuse or guess from unrelated Vercel teams/workspaces.

- [ ] **Step 3: Deploy only non-production/preview revisions where the platform supports isolation.**

If a Supabase isolated branch would incur cost, stop and obtain the required cost confirmation before creating it.

- [ ] **Step 4: Run negative security probes and capture only non-secret evidence.**

Capture status code, structured error code, request/correlation identifiers where available, source commit SHA, deployment ID, and runtime version. Never capture secret values.

- [ ] **Step 5: Verify Gateway provider-neutral behavior with a deterministic mocked/stubbed runtime response before a paid provider call.**

Required accepted payload uses `provider: 'claude'`; malformed/empty provider must still fail closed.

- [ ] **Step 6: Stop at the paid-E2E gate.**

Request separate explicit authorization before exactly one real Claude execution. Production merge/deploy remains another separate approval after that evidence is reviewed.

---

## Self-review result

- Spec coverage: Gateway identity, independent user JWT, provider-neutral contract, metric-integrity failure, health dependency, negative tests, Lagensuper-Pro regression gates, paid-E2E gate, and Production gate are all mapped to tasks above.
- Placeholder scan: no implementation step depends on unspecified code behavior; environment/deployment IDs that cannot be safely inferred are explicit stop-and-confirm gates rather than guessed values.
- Type consistency: the planned W interface consistently uses `runtimeSecret?: string` and the wire header is consistently `x-lsuperagent-runtime-secret`; environment key is consistently `RUNTIME_SHARED_SECRET`.
