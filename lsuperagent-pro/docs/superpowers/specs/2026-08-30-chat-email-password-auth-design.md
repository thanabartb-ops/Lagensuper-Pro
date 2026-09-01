# Chat email/password auth gate design

## Status

Approved design for the next LSUPERAGENT V11 Chat milestone. This document is design-only. It does not authorize a production deployment.

## Goal

Require a real Supabase email/password session before a user can enter or execute Chat, while preserving the existing V11 Chat pipeline and the prompt handoff from the landing page.

The intended path is:

```text
Landing
  -> optional pending prompt
  -> session check
     -> authenticated: /chat
     -> unauthenticated: /login?next=/chat
        -> Supabase email/password sign-in
        -> /chat
        -> consume pending prompt once
        -> /api/chat
        -> Trusted Gateway
        -> existing runtime
```

Direct navigation to `/chat` uses the same auth gate.

## Scope

This milestone adds only:

- Supabase email/password sign-in.
- A dedicated `/login` route.
- A client-side auth gate before `SmartChatView` mounts.
- Reuse of one browser Supabase client for login, session checks, and authenticated Chat requests.
- Safe return to `/chat` after successful login.
- Preservation of a landing-page prompt across login.
- Fail-closed handling when the session disappears or `/api/chat` returns 401.
- Focused tests plus the existing release verification commands.

## Non-goals

This milestone does not add:

- Sign up.
- Forgot/reset password.
- Magic Link.
- Google or other OAuth providers. Superseded by a later milestone: see
  `2026-08-31-chat-oauth-social-login-design.md`.
- Guest or anonymous Chat.
- Server-side session middleware or a cookie-based SSR auth migration.
- Changes to Deep Research, Image, Agent Mode, or Memory.
- A second provider runtime or any browser-side provider credential.
- Production merge or production deployment.

## Existing constraints

- GitHub remains the code source of truth.
- The existing Supabase runtime remains runtime authority and must not be rebuilt or duplicated.
- `LS_BOTAGENT` remains the Chat assistant name.
- `/api/chat` remains the same-origin Chat boundary and still validates the Bearer token server-side.
- Browser code may use only the existing public Supabase URL and publishable key.
- No service-role key or provider secret may enter browser code.
- Relevant mobile UI is verified at 393 x 852.
- Delivery remains branch -> checks -> Preview -> explicit production approval.

## Architecture

### Browser auth service

Create `components/v11/services/browserAuth.ts` as the single browser-auth boundary.

Responsibilities:

- Create and cache one Supabase browser client using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Expose a small interface for:
  - current session lookup,
  - email/password sign-in,
  - auth-state subscription,
  - clearing an invalid session when a server-authenticated Chat request is rejected.
- Normalize Supabase errors into app-level outcomes. Raw Supabase errors are not rendered to the user.

`runtimeAdapter.ts` must stop owning a separate Supabase client and instead use this service to obtain the current access token.

### Login route

Add `app/login/page.tsx` and `components/v11/components/auth/LoginView.tsx`.

`LoginView` contains:

- Email input.
- Password input.
- One submit button labeled `เข้าสู่ระบบ`.
- A link/action back to the landing page.
- Inline, user-safe error text.

No sign-up or password-recovery affordance appears in this milestone.

### Chat auth gate

Add `components/v11/components/auth/RequireAuth.tsx` and wrap the Chat route before `SmartChatView` mounts.

State model:

```text
CHECKING -> AUTHENTICATED
         -> UNAUTHENTICATED -> /login?next=/chat
```

While `CHECKING`, Chat UI and pending-prompt consumption do not mount.

When `AUTHENTICATED`, `SmartChatView` mounts normally and may consume the pending prompt exactly once.

The gate subscribes to Supabase auth-state changes. If the session disappears after Chat has mounted, the route fails closed and returns to login.

## Navigation and return-path safety

The login page may read `next`, but it must never navigate to an arbitrary URL.

For this milestone the only accepted post-login destination is `/chat`. Any missing, malformed, absolute, protocol-relative, or unsupported value falls back to `/chat`.

This prevents an open-redirect path from being introduced by the login flow.

## Landing-page flow

### User already authenticated

1. User types a prompt on the landing page.
2. The prompt is written to the existing session-storage handoff.
3. Navigation goes to `/chat`.
4. `RequireAuth` confirms the session.
5. `SmartChatView` mounts and consumes the prompt once.
6. Chat sends the prompt through the existing runtime adapter.

### User not authenticated

1. User types a prompt on the landing page.
2. The prompt is written to the existing session-storage handoff.
3. Navigation reaches the Chat auth gate.
4. No Chat request is allowed.
5. User is redirected to `/login?next=/chat`.
6. Successful email/password sign-in returns to `/chat`.
7. The auth gate confirms the new session.
8. `SmartChatView` mounts and consumes the original prompt once.

The pending prompt is not cleared by the auth gate or login page.

## Direct `/chat` flow

When an unauthenticated user opens `/chat` directly:

- `RequireAuth` checks the session before mounting Chat.
- No `/api/chat` call is made.
- The user is sent to `/login?next=/chat`.

If a valid session already exists, Chat mounts without showing the login page.

## Login behavior

On submit:

1. Trim and validate the email field and require a non-empty password.
2. Disable submit while the request is in flight to prevent duplicate sign-in attempts.
3. Call Supabase `signInWithPassword` through `browserAuth.ts`.
4. On success, navigate only to the sanitized internal return path.
5. On invalid credentials, show `อีเมลหรือรหัสผ่านไม่ถูกต้อง`.
6. If auth/config/service is unavailable, show `ระบบเข้าสู่ระบบยังไม่พร้อม กรุณาลองใหม่อีกครั้ง`.

The form supports Enter-to-submit and uses normal form semantics.

## Runtime 401 and expired-session behavior

`/api/chat` remains responsible for verifying the Bearer token even though the UI has already checked the session.

If an authenticated-looking browser session receives 401 from `/api/chat`:

1. Treat the result as `UNAUTHENTICATED`; never turn it into a successful assistant message.
2. Preserve the unsatisfied user prompt back into the existing pending-prompt handoff before leaving Chat.
3. Clear the invalid local session through the browser auth service.
4. Navigate to `/login?next=/chat`.
5. After successful login, the preserved prompt is delivered once.

This is defense in depth and prevents a stale local session from bypassing the login gate or silently losing the user's request.

## Chat behavior and error handling

- No authenticated session means no provider-bound Chat request.
- Login failure never falls back to guest or mock execution.
- Runtime failure never becomes a canned successful response.
- Non-auth runtime errors remain visible as failures inside Chat according to the existing adapter contract.
- Only an actual verified runtime result is rendered as a successful assistant response.

## Landing login action

Replace the disabled preview-only login action in the landing hero with a real `เข้าสู่ระบบ` action that navigates to `/login?next=/chat`.

The primary landing Chat composer remains the main Chat entry point. It can preserve a typed prompt before the auth gate redirects the user.

## UI requirements

Login is intentionally minimal:

```text
LSUPERAGENT

เข้าสู่ระบบ

[ Email                  ]
[ Password               ]

[        เข้าสู่ระบบ        ]

กลับหน้าหลัก
```

Requirements:

- Single-column layout on mobile.
- Touch targets at least 44 px where applicable.
- Inputs have programmatic labels and visible focus states.
- Password uses a password input; no password is logged or persisted by app code.
- Submit state is visibly disabled while signing in.
- Error text is concise Thai and associated with the form for accessibility.
- Verify at 393 x 852.

## Planned files

New:

- `app/login/page.tsx`
- `components/v11/components/auth/LoginView.tsx`
- `components/v11/components/auth/RequireAuth.tsx`
- `components/v11/services/browserAuth.ts`
- `tests/v11-auth-flow.test.tsx`

Expected updates:

- `app/chat/page.tsx`
- `components/v11/V11Landing.tsx`
- `components/v11/components/landing/HeroSection.tsx`
- `components/v11/services/runtimeAdapter.ts`
- Existing Chat regression tests only where required by the new auth boundary.

No other capability files are in scope.

## Test design

Write focused tests before implementation for these behaviors:

1. Unauthenticated `/chat` redirects to `/login?next=/chat` before `SmartChatView` mounts.
2. An unauthenticated route guard never triggers `/api/chat`.
3. A valid existing session renders Chat without a login round-trip.
4. Email/password success navigates to sanitized `/chat`.
5. Invalid credentials show the expected Thai message and do not navigate.
6. Auth unavailable shows the service-unavailable Thai message.
7. Duplicate submit is blocked while sign-in is pending.
8. A landing prompt survives the login redirect and is delivered once after authentication.
9. Runtime 401 preserves the unsatisfied prompt, clears the invalid session, and returns to login.
10. Unsafe `next` values fall back to `/chat`.
11. Existing Chat runtime-adapter tests remain green.
12. Relevant mobile structure remains usable at the 393 x 852 target.

## Verification gate

Before this milestone can be called implementation-complete on the branch, run and require success for:

```text
pnpm guard:secrets
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Then verify the Preview at 393 x 852 and exercise the real auth boundary without claiming Chat LIVE unless the downstream runtime execution itself is also evidenced.

## Release boundary

This milestone stops at branch/Preview verification unless the user separately gives explicit approval to merge/deploy Production.

No database migration, key rotation, provider-secret change, or production deployment is part of this design.
