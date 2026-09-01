# Runtime Gateway P0 Security Design

**Date:** 2026-08-30
**Status:** Approved design, pending implementation plan and implementation
**Scope:** LSUPERAGENT V11 Chat path only

## Problem

The intended Chat path is:

```text
Browser
  -> Lagensuper-Pro /api/chat
  -> Trusted Gateway /api/chat
  -> Supabase conversation runtime
  -> Claude
```

The audited implementation currently has two P0 gaps at the Gateway -> Runtime boundary:

1. The deployed Supabase conversation runtime validates the user's Supabase JWT internally but does not verify that the caller is the Trusted Gateway. Because the Edge Function is deployed with `verify_jwt=false`, any caller holding a valid Supabase user token can bypass the Trusted Gateway and call the runtime directly.
2. The inspected W R7 Gateway source validates execution payloads only when `provider === 'xai'` and returns top-level `provider: 'xai'`, while the deployed conversation runtime is provider `claude`. Claude execution through the canonical Gateway is therefore not proven compatible.

## Goal

Close the direct authenticated-user bypass and make the Gateway execution contract provider-neutral without changing the existing Browser -> Lagensuper-Pro -> R3 Gateway authentication contract.

## Non-goals

- Do not change the browser authentication model.
- Do not expose a privileged secret to browser code.
- Do not reuse the R3 app-to-Gateway HMAC secret for Gateway-to-Runtime authentication.
- Do not rebuild or duplicate the existing Supabase conversation runtime.
- Do not enable Deep Research, Image, Agent Mode, or Memory runtime execution in this milestone.
- Do not merge to `main` or deploy Production without a separate explicit Production approval.
- Do not run a paid Claude E2E until all pre-E2E security and compatibility tests pass.

## Trust boundaries

### Boundary A: Browser -> Lagensuper-Pro

Keep the current Supabase user session model. Browser code uses only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The browser sends the user access token only to same-origin `/api/chat`.

### Boundary B: Lagensuper-Pro -> Trusted Gateway

Keep the current R3 HMAC contract unchanged:

- `x-lsuperagent-client`
- `x-lsuperagent-request-id`
- `x-lsuperagent-timestamp`
- `x-lsuperagent-nonce`
- `x-lsuperagent-signature`
- user `Authorization: Bearer <Supabase access token>`

This milestone must not modify the R3 signing string or its replay/timestamp behavior.

### Boundary C: Trusted Gateway -> Supabase conversation runtime

Add a distinct server-to-server credential named `RUNTIME_SHARED_SECRET`.

The Gateway backend client sends:

- `Authorization: Bearer <user Supabase access token>`
- `x-lsuperagent-runtime-secret: <RUNTIME_SHARED_SECRET>`

The runtime validates the runtime secret before parsing the request, before validating the user token, and before any provider call.

The runtime then validates the user token separately using Supabase Auth. Gateway identity and user identity are independent requirements; both must pass.

The runtime secret must:

- exist only in the Trusted Gateway server environment and Supabase Edge Function secrets;
- never be exposed in `NEXT_PUBLIC_*` values;
- never be logged or returned in an error;
- be distinct from `LSUPERAGENT_GATEWAY_HMAC_SECRET`.

A future dedicated HMAC on the Gateway -> Runtime hop may replace this bounded shared-secret proof, but is not required for this milestone.

## Provider-neutral execution contract

The Gateway backend execution validator must accept any non-empty provider string when all other verified execution fields are valid.

Required runtime execution shape:

```ts
{
  status: 'EXECUTED',
  runtime_version: string,
  provider: string,       // non-empty
  model: string,          // non-empty
  evidence: {
    provider_request_id: string,
    correlation_id: string,
    qa_run_id: string,
  }
}
```

The Gateway top-level verified response must mirror the verified runtime provider:

```ts
{
  requestId,
  status: 'verified',
  gateway: 'CONNECTED',
  backend: 'CONNECTED',
  provider: execution.data.provider,
  data: execution.data,
}
```

The Gateway must reject a 200 payload if:

- provider is missing or empty;
- runtime/model/evidence identifiers are missing;
- the payload is not `EXECUTED`.

Lagensuper-Pro already checks that top-level provider and nested runtime provider match; that behavior remains unchanged.

## Runtime fail-closed behavior

The Supabase conversation runtime must apply the following order:

1. OPTIONS handling only for preflight.
2. For POST execution, require `RUNTIME_SHARED_SECRET` configuration.
3. Compare `x-lsuperagent-runtime-secret` to configured secret.
4. Reject missing/wrong runtime secret before body parsing or provider work.
5. Validate Supabase user JWT.
6. Parse and validate request body.
7. Perform rate-limit lookup.
8. Require Claude provider configuration.
9. Execute provider request.
10. Require provider request ID and non-empty output.
11. Insert success evidence metric and verify the insert succeeded.
12. Only then return `EXECUTED`.

If the runtime secret is not configured, execution must fail closed with a server-unavailable status rather than silently accepting direct calls.

## Runtime integrity fixes included

### Metric insert

The success-path `metric_events.insert(...)` result must be checked. If the insert fails, the runtime must not return the normal evidence-backed `EXECUTED` response.

### Health dependency

The health endpoint should verify the request-path database dependency using a non-mutating `metric_events` probe rather than relying only on `auth.admin.listUsers()` reachability.

### CORS

CORS must no longer be treated as a security boundary. Narrow `Access-Control-Allow-Origin` where practical after the server-to-server runtime proof is enforced. Server-side callers remain governed by runtime-secret and user-JWT checks.

## Error semantics

### Gateway backend client

- Missing runtime secret configuration: fail closed, no backend request.
- Backend 401: user unauthenticated.
- Backend 403: forbidden/runtime identity rejected.
- Backend 429: policy blocked.
- Other non-2xx: upstream failed.
- Invalid 200 payload: upstream failed.

### Runtime

- Runtime secret missing from environment: `FAILED` / 503.
- Runtime secret missing or wrong on request: `BLOCKED` / 403.
- User JWT invalid: `BLOCKED` / 401.
- Invalid JSON/body: `BLOCKED` / 400.
- Rate limit exceeded: `BLOCKED` / 429.
- Provider not configured: `FAILED` / 503.
- Provider/runtime evidence failure: `FAILED` / 502.
- Metric success insert failure: `FAILED` / 500.

No error response may include secret values or raw provider bodies.

## Test requirements

### W Trusted Gateway

Add/modify tests that prove:

1. R3 app-to-Gateway authentication remains unchanged.
2. Gateway backend POST includes user Bearer token only in `Authorization`.
3. Gateway backend POST includes `x-lsuperagent-runtime-secret` from server environment.
4. Missing runtime secret configuration fails before backend POST.
5. A verified Claude execution (`provider: 'claude'`) is accepted.
6. A verified xAI execution remains accepted if it satisfies the provider-neutral contract.
7. Empty/missing provider is rejected.
8. Top-level verified response mirrors the runtime provider instead of hard-coding xAI.

### Supabase runtime

Before any paid E2E, prove with deterministic tests or controlled HTTP checks that:

1. Valid user token + no runtime secret -> blocked, no provider call.
2. Valid user token + wrong runtime secret -> blocked, no provider call.
3. Correct runtime secret + invalid user token -> blocked, no provider call.
4. Correct runtime secret + valid token + malformed body -> blocked, no provider call.
5. Rate-limit lookup failure -> failed, no provider call.
6. Missing provider request ID -> failed.
7. Metric insert failure -> no normal `EXECUTED` response.

### Lagensuper-Pro

Re-run existing R1/R2 gates and Chat/Auth tests. No browser-side runtime secret may appear in code, public environment contracts, or built client source.

## Rollout sequence

1. Lock this design and implementation plan in GitHub.
2. Implement W Gateway changes on a non-production branch using TDD.
3. Verify W tests/lint/typecheck/build.
4. Prepare updated Supabase runtime source and tests/negative probes.
5. Do not deploy the updated shared runtime until the target environment and rollout are explicitly confirmed.
6. Configure the same `RUNTIME_SHARED_SECRET` in Gateway server environment and runtime secret store without exposing the value.
7. Deploy/verify the secured runtime and matching Gateway revision in a non-production/preview path where available.
8. Re-run negative security checks.
9. Only after all security gates pass, request explicit authorization for exactly one paid Claude E2E.
10. Capture provider request ID, correlation ID, QA run ID, runtime version, provider/model, and metric persistence evidence.
11. Production merge/deploy remains a separate explicit approval.

## Acceptance criteria

This P0 milestone is complete only when all are true:

- Direct authenticated-user calls to the runtime without Trusted Gateway identity are blocked.
- Gateway-to-Runtime secret is server-only and distinct from R3 HMAC secret.
- User JWT is still required and validated separately.
- Gateway accepts Claude through a provider-neutral verified contract.
- Gateway no longer hard-codes top-level xAI for verified execution.
- Metric persistence failure cannot produce a normal `EXECUTED` success response.
- Existing R3 authentication behavior remains green.
- Lagensuper-Pro R1/R2 gates remain green.
- No provider call is made during negative security tests.
- No Production merge/deploy occurs without separate explicit approval.
