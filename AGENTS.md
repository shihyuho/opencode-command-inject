# AGENTS.md

Minimal guardrails for agents working in `opencode-command-inject`.

## Repo-specific constraints

- Preserve existing behavior on name collisions. Manual `loadedSkills` beat discovered skills, and injected commands must not overwrite existing commands or config-defined commands. Log a warning instead of silently replacing behavior.
- Treat config loading, skill discovery, and optional command sources as recoverable. Missing files, parse failures, and discovery issues should warn and fall back safely rather than crash the plugin.
- Keep warning prefixes consistent with existing runtime logs: `[command-inject]` and `[command-sources]`.
- If you change `src/config/types.ts` or `src/config/schema.ts`, run `bun run generate-schema` so `opencode-command-inject.schema.json` stays in sync with the published package.
- Before and after each GSD action, update `docs/GSD.md` so the command flow, purpose, and outputs stay current.