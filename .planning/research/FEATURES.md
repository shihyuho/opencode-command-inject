# Feature Landscape

**Domain:** OpenCode command-injection plugin naming configurability
**Researched:** 2026-03-26

## Table Stakes

Features users expect. Missing = plugin feels unsafe or annoying to adopt.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Backward-compatible default naming | Existing users expect current names (`make:build`, `pnpm:dev`, `skill:review`) to keep working with no config changes | Low | Must default to current prefixed behavior. This is the most important adoption safeguard. |
| Global prefix on/off switch | Users expect one obvious way to say “keep prefixes” or “drop prefixes” across the plugin | Low | Best fit is top-level `command_name_prefix` as enable/disable only, per project requirements. |
| Per-source override of prefix behavior | Users expect finer control because Makefile/NPM/skill commands have different collision risks and naming needs | Medium | Source config should override the global default for `makefile`, `npm-scripts`, and `skill`. |
| Per-source custom prefix text | Once per-source override exists, users expect to replace `make`/`npm`/`skill` with a clearer source label | Medium | Keep format fixed as `prefix:name`; do not expand to arbitrary patterns in this milestone. |
| Collision-safe fallback when unprefixed/custom names clash | Users will not tolerate silently losing commands after disabling or changing prefixes | High | If `build` collides, affected commands should fall back to source-prefixed naming automatically instead of shadowing or failing open. |
| Preserve existing/manual commands over generated ones | Current plugin already treats existing commands/config as authoritative; naming config must not weaken that guarantee | Medium | Collision handling must still respect current “keep existing, warn, skip injection” behavior. |
| Clear docs with examples for defaults, overrides, and collision outcomes | Naming config is user-facing; users need to predict final command names before enabling it | Medium | README + `docs/configuration.md` should show before/after examples for each source and for collisions. |
| Test coverage for default, override, and collision behavior | This feature changes naming, which is easy to regress and hard for users to diagnose | Medium | Table-stakes tests: default behavior, global disable, per-source override, custom prefix value, collision fallback, collision against existing commands, and schema validation. |

## Differentiators

Features that add polish or operator confidence, but are not required for this milestone.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Collision diagnostics that explain the final chosen name | Reduces confusion when the plugin auto-falls back from `build` to `make:build` | Medium | Could be warning text or richer debug output. Useful, not essential. |
| Command listing/docs that show original name + final injected name | Helps users understand how config changed generated commands | Medium | Similar to Gemini CLI’s `/mcp` display idea; good UX, but not needed to ship v1. |
| Reserved-name preflight validation | Warns before startup injection if config is likely to collide with built-ins or manual commands | High | Valuable later, but current plugin model already tolerates runtime warn-and-skip behavior. |
| Temporary migration aliases from old prefixed names to new names | Softens rollout for teams switching naming style | High | Nice for large teams, but unnecessary for a small naming-control milestone. |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Arbitrary command naming templates or delimiter customization | Explodes test matrix, docs complexity, and collision surface for little user value | Keep one naming shape: `prefix:name` |
| Global custom prefix text | Blurs ownership between global policy and source identity | Keep top-level config as enable/disable only; customize prefix text per source |
| Silent last-write-wins collision handling | Makes commands disappear unpredictably and violates current plugin behavior | Keep current preserve-existing model with warnings and deterministic fallback |
| Opaque auto-renames like numeric suffixes (`build-2`) | Users cannot guess names and docs become misleading | Fall back to meaningful source-prefixed names |
| Alias generation for every possible naming variant | Creates clutter and increases ambiguity in slash-command discovery | Generate one canonical final name per command |

## Feature Dependencies

```text
Backward-compatible default naming
  → Global prefix on/off switch
  → Per-source override of prefix behavior
  → Per-source custom prefix text

Global prefix on/off switch
  + Per-source override of prefix behavior
  + Per-source custom prefix text
  → Collision-safe fallback when unprefixed/custom names clash

Collision-safe fallback when unprefixed/custom names clash
  → Preserve existing/manual commands over generated ones
  → Clear docs with examples for defaults, overrides, and collision outcomes
  → Test coverage for default, override, and collision behavior
```

## MVP Recommendation

Prioritize:
1. Backward-compatible default naming
2. Global prefix on/off switch + per-source override
3. Collision-safe fallback that still preserves existing/manual commands
4. Schema/docs/tests covering the exact naming matrix

Defer:
- Collision diagnostics that explain the final chosen name: useful polish, but not required to make v1 safe
- Reserved-name preflight validation: helpful later if runtime collision frequency becomes a support issue
- Migration aliases: too much complexity for a brownfield naming-control milestone

## Sources

- `.planning/PROJECT.md` — project requirements and explicit out-of-scope list (HIGH confidence)
- `README.md` — current user-facing naming defaults for Makefile, npm scripts, and skills (HIGH confidence)
- `docs/configuration.md` — current config precedence and documentation expectations (HIGH confidence)
- `src/plugin/command-inject.ts`, `src/plugin/command-inject.test.ts` — existing preserve-existing collision semantics and test expectations (HIGH confidence)
- `src/command-sources/aggregator.ts`, `src/command-sources/aggregator.test.ts` — current keep-first duplicate handling across generated sources (HIGH confidence)
- https://oclif.io/docs/command_discovery_strategies (official docs, updated 2026-03-19) — confirms colon-separated command names are a normal CLI pattern (HIGH confidence)
- https://github.com/google-gemini/gemini-cli/pull/5130 — example of centralized reserved-name collision handling and need for secondary-collision tests (MEDIUM confidence)
- https://github.com/anthropics/claude-code/issues/22517 — user expectation that displayed command names keep namespace prefixes consistently (MEDIUM confidence)
- https://github.com/openclaw/openclaw/issues/38302 — example of prefix configurability used primarily for disambiguation and targeting, not free-form formatting (MEDIUM confidence)
