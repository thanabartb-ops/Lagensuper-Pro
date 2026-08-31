# Chat OAuth social login design

## Status

Implemented on `agent/v11-canonical-live-smart-chat`. This document is design
plus the provider configuration runbook. It does not authorize a production
deployment.

Supersedes the OAuth non-goal in
`2026-08-30-chat-email-password-auth-design.md`. Every other constraint in that
document still holds.

## Goal

Let a user reach Chat through Google, Microsoft, or Apple instead of an
email/password pair, without adding a second session model.

An OAuth session is the same Supabase session the password flow produces, so
`RequireAuth`, `/api/chat` Bearer validation, the pending-prompt handoff, and
the runtime 401 recovery path are all unchanged.

## Scope

This milestone adds only:

- `signInWithOAuth` on the existing browser auth service.
- Google, Microsoft, and Apple buttons on `/login`, serving both login and
  signup mode.
- Provider-name translation at the service boundary.
- Focused tests at the service and view level.

## Non-goals

This milestone does not add:

- Any further provider.
- Account linking between a password account and a social account.
- A custom OAuth callback route.
- Server-side session middleware or a cookie-based SSR auth migration.
- Provider credential storage in the repository or in browser code.
- Production merge or production deployment.

## Architecture

### One service boundary

`components/v11/services/browserAuth.ts` gains:

```text
signInWithOAuth(provider, client?) -> { status: 'authenticated' }
                                    | { status: 'unavailable' }
```

The two-state result is deliberate. A failed hand-off tells the user nothing
useful about which provider rejected it, and provider text is not safe to
render, so every failure — provider disabled, network error, malformed
config — normalizes to `unavailable`, exactly as the password path does.

No callback route is added. The browser client is already constructed with
`detectSessionInUrl: true`, so Supabase parses the returning URL and stores the
session itself.

### Provider-name translation

Supabase names the Microsoft provider `azure`. The app keeps `microsoft` as the
user-facing name and translates at the service boundary:

```text
google    -> google
microsoft -> azure
apple     -> apple
```

This is the failure mode most likely to reappear. `AuthClientLike` types
`provider` as `string`, so a wrong slug type-checks cleanly, reaches Supabase,
is rejected there, and surfaces to the user as the same generic
`unavailable` message every other failure produces. The service-level test
asserts the slug actually passed to the client, which is the only layer where a
wrong slug is visible.

### View

`components/v11/components/auth/OAuthProviderButtons.tsx` owns the three
buttons and their brand marks. `LoginView` owns the pending state.

- The label reads `ดำเนินการต่อด้วย <provider>` in both modes, because OAuth
  does not distinguish sign-in from sign-up.
- A hand-off disables every auth control, and only the chosen provider shows
  `กำลังเปิด <provider>...`.
- A successful hand-off leaves the pending state in place: the browser is
  navigating away, and clearing it would flash an interactive form during
  the redirect.
- An `unavailable` result restores every button so the user can retry or fall
  back to a password.

## Provider configuration runbook

The code is inert until the providers are enabled. No browser environment
variable is involved — client IDs and secrets live in the Supabase project
only.

For each provider, in Supabase Dashboard -> Authentication -> Providers:

| Button | Supabase provider | Credentials from | Notes |
| --- | --- | --- | --- |
| Google | Google | Google Cloud Console -> Credentials -> OAuth client ID | Web application type |
| Microsoft | **Azure** | Azure Portal -> App registrations | Listed as Azure, not Microsoft |
| Apple | Apple | Apple Developer -> Certificates, Identifiers & Profiles | Requires a paid Apple Developer account |

Then:

1. Set each provider's callback/redirect URL to
   `https://<project-ref>.supabase.co/auth/v1/callback`.
2. Add every deployed origin under Authentication -> URL Configuration ->
   Redirect URLs. A missing origin sends the user back to a blocked URL after
   an otherwise successful provider sign-in.
3. Confirm `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   are set for the deployment.

A provider left disabled is not a broken build: its button shows the standard
unavailable message while the other providers and the password form keep
working.

## Test design

Service level, against a stub client — the layer where the slug is observable:

1. Each provider reaches Supabase under its correct slug, Microsoft as `azure`.
2. A provider error normalizes to `unavailable` and leaks no provider text.
3. A thrown hand-off normalizes to `unavailable`.
4. An unconfigured browser client returns `unavailable`.

View level:

5. Each button starts its own provider and never calls the password paths.
6. `unavailable` shows the Thai message, does not navigate, and leaks no
   provider text.
7. Buttons re-enable after `unavailable` so a retry is possible.
8. A pending hand-off blocks duplicate submits across every auth control.
9. Only the chosen provider shows the pending label.
10. Signup mode offers the same three providers.

## Verification gate

```text
pnpm guard:secrets
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Provider hand-off itself cannot be exercised from CI or from an agent sandbox
without outbound access to the providers. It is verified manually on Preview at
393 x 852, one provider at a time, checking that the session persists, that
`/chat` mounts behind `RequireAuth`, and that sign-out clears it.

## Release boundary

This milestone stops at branch/Preview verification unless the user separately
gives explicit approval to merge/deploy Production.

No database migration, key rotation, or production deployment is part of this
design.
