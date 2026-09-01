# V11 Canonical Live Smart Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the V11 Smart Chat UI to the existing trusted runtime boundary without introducing a second provider runtime inside Next.js.

**Architecture:** Keep GitHub as code source of truth and the existing trusted runtime/gateway as execution authority. The browser authenticates with Supabase using the existing publishable client configuration, then calls a same-origin `/api/chat` route with the user access token. The Next.js route validates input, signs a server-to-server gateway request with server-only environment variables, and accepts provider-neutral verified responses. The V11 UI consumes this route through a runtime adapter; `deep_research`, `create_image`, `agent_mode`, and `memory` remain unchanged until their own integration tasks.

**Tech Stack:** Next.js 16.3.1, React 19.2.8, TypeScript 5, Supabase JS 2.112.3, Vitest 4.1.11, Vercel preview deployments.

**Spec:** `lsuperagent-pro/.codex/LSUPERAGENT_CONTEXT.md`

## Global Constraints

- Product: LSUPERAGENT V11 Public Beta.
- UI assistant name: LS_BOTAGENT.
- Code source of truth: GitHub.
- Runtime source: existing trusted runtime; do not rebuild or duplicate it in Next.js.
- Preserve MVP routes: `smart_chat`, `deep_research`, `create_image`, `agent_mode`, `memory`.
- Preserve shared route pipeline: guardrails -> retry(fetch) -> dedup -> retry(synth) -> QC.
- Browser code may use only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; privileged gateway secrets remain server-only.
- No service-role key, provider API key, gateway HMAC secret, or other privileged secret may be committed or exposed to browser code.
- Verify relevant UI changes at 393 x 852.
- Delivery remains branch -> lint/types/tests/build -> preview -> explicit production approval.
- No production deployment, merge, migration, key rotation, destructive Git action, or database write in this task.

---

### Task 1: Restore the provider-neutral trusted gateway server boundary

**Files:**
- Create: `lsuperagent-pro/lib/gateway/chat-request.ts`
- Create: `lsuperagent-pro/lib/gateway/context.ts`
- Create: `lsuperagent-pro/lib/gateway/r3-signing.ts`
- Create: `lsuperagent-pro/lib/gateway/server-dispatch.ts`
- Modify: `lsuperagent-pro/lib/gateway/types.ts`
- Create: `lsuperagent-pro/app/api/chat/route.ts`
- Test: `lsuperagent-pro/tests/v11-canonical-chat-route.test.ts`

**Interfaces:**
- Consumes: authenticated `Authorization: Bearer <Supabase access token>` and JSON `{ message: string, workspaceId?: string | null }`.
- Produces: same-origin `/api/chat` response `{ status: 'verified', requestId, data }` on success; structured `401/403/429/503/500` failures otherwise.
- Server-only configuration: `LSUPERAGENT_GATEWAY_URL`, `LSUPERAGENT_GATEWAY_CLIENT_ID=lsuperagent-pro`, `LSUPERAGENT_GATEWAY_HMAC_SECRET`; optional `VERCEL_AUTOMATION_BYPASS_SECRET`.

- [ ] **Step 1: Write the failing route/dispatch tests**

Create tests that prove: unauthenticated requests return 401; malformed payloads return 400; verified upstream execution returns 200; provider identity is treated as an opaque non-empty string rather than hard-coded to one provider; malformed upstream success becomes 503.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `pnpm vitest run tests/v11-canonical-chat-route.test.ts`
Expected: FAIL because `/api/chat` and gateway server modules do not exist on `main`.

- [ ] **Step 3: Implement the minimal provider-neutral gateway boundary**

Port the established request parser, context builder, signing flow, and trusted dispatch structure from `agent/pro-r8-supabase-auth-v1`, but replace provider-specific `xai` checks with a provider-neutral contract: `provider` must be a non-empty string and `data.provider` must match the top-level provider. Keep user Bearer auth mandatory.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `pnpm vitest run tests/v11-canonical-chat-route.test.ts`
Expected: PASS with no warnings.

- [ ] **Step 5: Commit**

```bash
git add lsuperagent-pro/lib/gateway lsuperagent-pro/app/api/chat/route.ts lsuperagent-pro/tests/v11-canonical-chat-route.test.ts
git commit -m "feat(v11): restore trusted smart chat gateway"
```

### Task 2: Connect V11 Smart Chat through Supabase-authenticated browser execution

**Files:**
- Create: `lsuperagent-pro/lib/auth/browser-auth.ts`
- Modify: `lsuperagent-pro/components/v11/services/runtimeAdapter.ts`
- Modify: `lsuperagent-pro/components/v11/components/chat/SmartChatView.tsx`
- Test: `lsuperagent-pro/tests/v11-live-smart-chat.test.tsx`

**Interfaces:**
- Consumes: browser Supabase session from `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Produces: `GatewayRuntimeAdapter.executePrompt(prompt, 'smart_chat') -> { status, message }` using `/api/chat`; other MVP routes continue to return the existing NOT_CONNECTED mock result until integrated separately.

- [ ] **Step 1: Write failing adapter/UI tests**

Tests must prove: `smart_chat` uses the authenticated `/api/chat` path; missing session returns an explicit unauthenticated/not-connected result; a verified response becomes non-demo assistant output; the UI header/banner no longer hard-codes `DEMO/OFFLINE` when the adapter reports a connected verified execution.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `pnpm vitest run tests/v11-live-smart-chat.test.tsx`
Expected: FAIL because `defaultRuntimeAdapter` is still `MockRuntimeAdapter` and the Smart Chat header/banner are hard-coded.

- [ ] **Step 3: Implement the authenticated browser helper and Smart Chat adapter**

Port the established Supabase browser-session helper from `agent/pro-r8-supabase-auth-v1`. Add a provider-neutral `GatewayRuntimeAdapter` that uses the helper only for `smart_chat`; retain `MockRuntimeAdapter` behavior for the remaining four MVP routes. Keep secrets out of client code.

- [ ] **Step 4: Make Smart Chat status dynamic**

Render status badges/banners from the adapter result instead of hard-coded `DEMO`, `OFFLINE`, and `NOT_CONNECTED` claims. Preserve LS_BOTAGENT naming and mobile layout.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `pnpm vitest run tests/v11-live-smart-chat.test.tsx`
Expected: PASS with no warnings.

- [ ] **Step 6: Commit**

```bash
git add lsuperagent-pro/lib/auth/browser-auth.ts lsuperagent-pro/components/v11/services/runtimeAdapter.ts lsuperagent-pro/components/v11/components/chat/SmartChatView.tsx lsuperagent-pro/tests/v11-live-smart-chat.test.tsx
git commit -m "feat(v11): connect smart chat to trusted gateway"
```

### Task 3: Evolve CI from PRO-R2 mock-only contract to the V11 Smart Chat live boundary

**Files:**
- Modify: `.github/workflows/pro-r2-verify.yml`
- Create: `.github/workflows/v11-live-smart-chat-verify.yml`
- Test: CI plus Vercel preview.

**Interfaces:**
- Consumes: all Task 1 and Task 2 files.
- Produces: a PR check that allows exactly `/api/chat` while continuing to prohibit unapproved server routes and provider API keys in application code.

- [ ] **Step 1: Update the legacy mock-only guard**

Remove only `app/api/chat/route.ts` from the legacy prohibited-route list. Keep `app/api/execute/route.ts`, memory mutation routes, tools, and audit routes prohibited. Keep provider secret-name scanning; do not add `GEMINI_API_KEY`, `OPENAI_API_KEY`, or any provider key to application code.

- [ ] **Step 2: Add a V11 integration verification workflow**

The workflow must run on this branch and PRs touching the new gateway/auth/Smart Chat files and execute: `pnpm install --frozen-lockfile`, `pnpm guard:secrets`, focused V11 tests, full `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build`.

- [ ] **Step 3: Open a draft PR and inspect CI**

Base: `main`
Head: `agent/v11-canonical-live-smart-chat`
Expected: all GitHub checks pass before the PR is marked ready.

- [ ] **Step 4: Verify the Vercel preview at 393 x 852**

Confirm the page renders without regression. If runtime environment variables are absent, the UI must fail closed with an explicit NOT_CONNECTED/UNAUTHENTICATED state rather than inventing a provider connection.

- [ ] **Step 5: Stop before merge/production**

Report CI/preview evidence and remaining environment-variable requirements. Do not merge or promote to production without explicit user approval.
