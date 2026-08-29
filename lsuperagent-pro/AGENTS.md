<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# LSUPERAGENT project rules

- Treat this directory as the LSUPERAGENT V11 Public Beta UI and use LS_BOTAGENT as the UI assistant name.
- Keep GitHub as the source of truth for code and the existing Supabase runtime as the runtime authority.
- Do not rebuild or duplicate the runtime to add a feature.
- Preserve the MVP routes: `smart_chat`, `deep_research`, `create_image`, `agent_mode`, and `memory`.
- Preserve the shared pipeline: guardrails -> retry(fetch) -> dedup -> retry(synth) -> QC.
- Read `.codex/LSUPERAGENT_CONTEXT.md` before architecture, auth, routing, memory, deploy, or operations work.
- Run `pnpm guard:secrets`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` before release.
- Verify relevant UI changes at 393 x 852.
- Never expose a service-role key to browser code or commit a secret.
- Never hard-code an account display name; render authenticated profile data.
- Use branches and previews. Require explicit approval before production deploys, migrations, key rotation, destructive Git actions, or database writes.
- Health checks are read-only and report only material changes, warnings, or errors.
