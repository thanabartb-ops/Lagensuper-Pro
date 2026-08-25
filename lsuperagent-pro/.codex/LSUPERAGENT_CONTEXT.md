# LSUPERAGENT active control context

- Product: LSUPERAGENT V5
- UI assistant name: LS_BOTAGENT
- Code source of truth: GitHub
- Runtime source: existing Supabase runtime; do not rebuild or duplicate it
- Read-only health project: ilzjtbfhoxirsuilwmor
- MVP routes: smart_chat, deep_research, create_image, agent_mode, memory
- Shared route pipeline: guardrails -> retry(fetch) -> dedup -> retry(synth) -> QC
- UI verification target: 393 x 852
- Auth identity: render the authenticated account name; never hard-code Bank
- Delivery: branch -> lint/types/tests/build -> preview -> explicit production approval
- Memory: promote only stable, evidenced, non-secret decisions; never save raw secrets or speculation
- Health checks: read-only; report material deltas; use ACTIVE_HEALTHY when no actionable issue exists
- High-impact actions: require explicit approval for production deploys, migrations, key rotation, destructive Git actions, or database writes
