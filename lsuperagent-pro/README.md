# LSUPERAGENT V11 Public Beta

Next.js port of the approved AI Studio V11 interface. This package is a browser client for the existing trusted LSUPERAGENT gateway; it does not create a parallel runtime, memory store, audit authority, or provider integration.

## Current boundary

- UI release: `V11 Public Beta`
- Assistant: `LS_BOTAGENT`
- Gateway: `NOT_CONNECTED`
- Adapter: `MockRuntimeAdapter`
- Runtime authority: existing Supabase-backed LSUPERAGENT runtime
- Server routes added by this port: none

## Routes

| Surface | Next.js route | Runtime route |
| --- | --- | --- |
| Landing dashboard | `/` | — |
| Smart Chat | `/chat` | `smart_chat` |
| Deep Research | `/tools/deep-research` | `deep_research` |
| Image Generation | `/tools/create-image` | `create_image` |
| Agent Mode | `/tools/agent-mode` | `agent_mode` |
| Memory | `/memory` | `memory` |
| Projects & Tools | `/projects` | — |
| Runtime | `/runtime` | — |
| Audit | `/audit` | — |
| Settings | `/settings` | — |

## Local development

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

Open `http://localhost:3000`.

## Verification

```bash
corepack pnpm guard:secrets
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

The release target remains mobile-first at `393 × 852`. Production deployment, database writes, migrations, key rotation, and runtime activation require separate explicit approval.
