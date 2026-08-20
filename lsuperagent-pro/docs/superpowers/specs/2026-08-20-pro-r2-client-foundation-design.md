# LSUPERAGENT PRO-R2 — Client Foundation + Gateway Contract

Date: 2026-08-20
Status: DESIGN_FOR_REVIEW
Branch: `agent/pro-r2-client-foundation-v1-spec`

## 1. Purpose

PRO-R2 extends the verified PRO-R1 shell into a navigable alternate-client foundation while preserving the canonical LSUPERAGENT authority boundary.

LSUPERAGENT PRO remains a thin client. It does not become a second core, gateway, policy engine, memory authority, audit authority, tool-execution authority, model runtime, database, or secret store.

## 2. Approved scope

PRO-R2 adds:

- application shell and navigation
- pages for Chat, Projects, Memory, Tools, Runtime, Audit, and Settings
- typed connection-status semantics
- reusable `StatusBadge`
- provider-neutral gateway request/response contracts
- a thin gateway client adapter that defaults to `NOT_CONNECTED`
- contract tests for navigation, status semantics, and gateway boundaries

The existing `/api/health` route remains the only server route implemented in this phase.

## 3. Explicit non-goals

PRO-R2 must not implement or enable:

- `/api/chat`
- `/api/execute`
- `/api/memory`
- `/api/memory/candidate`
- `/api/tools`
- `/api/audit`
- privileged tool execution
- canonical memory writes
- canonical audit writes
- a policy engine
- a second trusted gateway
- a second runtime
- a second database
- a second memory core
- live Supabase mutations
- provider API calls
- Vercel deployment
- production deployment
- domain or DNS changes

## 4. Authority boundary

```text
Browser
  ↓
LSUPERAGENT PRO
  ↓
Thin Gateway Client Adapter
  ↓
NOT_CONNECTED contract in PRO-R2
  ↓
Existing Trusted LSUPERAGENT Gateway
  ↓
Existing Canonical LSUPERAGENT
```

PRO-R2 may model the interface to the existing Trusted LSUPERAGENT Gateway, but it must not implement gateway authority itself.

## 5. Connection status contract

The client uses one shared type:

```ts
export type ConnectionStatus =
  | 'NOT_CONNECTED'
  | 'CONNECTED'
  | 'DEGRADED'
  | 'BLOCKED'
```

Semantics:

- `NOT_CONNECTED`: no verified live gateway connection exists
- `CONNECTED`: a later phase has verified the expected trusted endpoint and contract
- `DEGRADED`: the expected trusted path exists but is partially unavailable
- `BLOCKED`: policy or authorization intentionally denies the requested capability

PRO-R2 must render `NOT_CONNECTED` for gateway/backend status by default and must not claim `CONNECTED` without later execution evidence.

## 6. UI structure

Expected routes:

```text
/
/chat
/projects
/memory
/tools
/runtime
/audit
/settings
/api/health
```

Expected components:

```text
components/
├── shell/
│   ├── Sidebar.tsx
│   ├── MobileNav.tsx
│   └── Header.tsx
└── common/
    ├── StatusBadge.tsx
    └── Card.tsx
```

The shell must remain usable on desktop and mobile. Each module page may be intentionally minimal in PRO-R2, but it must make the connection state explicit and must not simulate live data.

## 7. Gateway contracts

Expected files:

```text
lib/gateway/
├── types.ts
└── client.ts
```

`types.ts` defines provider-neutral client contracts. It must not contain OpenAI-, Anthropic-, Gemini-, Ollama-, Supabase-service-role-, or vendor-specific execution types.

Baseline contract:

```ts
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
```

`client.ts` is a thin adapter only. In PRO-R2 it must return or expose `NOT_CONNECTED`/`not_connected` without attempting privileged network execution.

## 8. Environment and security boundary

The public environment contract remains:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_ENV=preview
```

PRO-R2 must not add browser-visible privileged secret names or values.

Forbidden browser/runtime source names include at minimum:

- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`
- `GITHUB_TOKEN`
- `VERCEL_TOKEN`

No production secret value may be committed.

## 9. Data behavior

All module pages are non-authoritative client views in PRO-R2.

- Chat: shell only; no model request
- Projects: shell/status only; no remote project mutation
- Memory: shell/status only; no canonical memory read/write wiring yet
- Tools: shell/status only; no execution endpoint
- Runtime: health/status presentation only
- Audit: shell/status only; no canonical audit query wiring yet
- Settings: local client presentation only; no secret persistence

No mock response may be presented as canonical data. Placeholder UI must be labeled as unavailable or not connected.

## 10. Error handling

The UI must distinguish unavailable connectivity from successful execution.

Rules:

- HTTP rendering success is not evidence of gateway success
- `NOT_CONNECTED` is the default until verified otherwise
- client errors must not be converted to fake `CONNECTED`
- privileged capability requests are out of scope rather than silently mocked
- raw provider responses and secrets are not logged

## 11. Testing strategy

Implementation follows TDD with observed RED before production implementation.

Minimum contract tests:

1. shell renders LSUPERAGENT PRO identity and navigation
2. all seven module destinations are discoverable from the shell
3. `StatusBadge` renders all four `ConnectionStatus` values
4. default gateway/backend state is `NOT_CONNECTED`
5. thin gateway client does not perform privileged execution in PRO-R2
6. only `/api/health` exists among PRO-R2 server routes
7. environment contract remains limited to the three approved public variables
8. privileged secret-name scan remains clean

Fresh verification sequence:

```text
pnpm install --frozen-lockfile
pnpm vitest run
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

A read-only GitHub Actions verification run must pass before PRO-R2 is reported verified.

## 12. Implementation boundaries

Expected implementation changes are restricted to `lsuperagent-pro/` plus a read-only GitHub Actions verification workflow if required for evidence.

The phase must not merge to `main`, deploy, mutate Supabase, or modify production infrastructure without a separate explicit approval gate.

## 13. Release gate

PRO-R2 is complete only when all of the following are true:

- approved PRO-R2 source is committed on the isolated feature branch
- RED evidence is observed before implementation
- Vitest passes
- ESLint passes
- standalone TypeScript check passes
- production build passes
- environment contract passes
- privileged secret-name scan passes
- no prohibited API route or authority is introduced
- no deployment or production mutation occurs

Next phase remains blocked after verification until explicit user approval.

## 14. Final status contract

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
