# opencode-command-inject

## What This Is

`opencode-command-inject` is an OpenCode plugin that scans a project for Makefile targets, package scripts, and local skills, then injects them as slash commands at startup. This milestone extends the existing brownfield plugin so users can control whether generated command names keep a source prefix such as `/make:build`, `/pnpm:dev`, or `/skill:review`.

## Core Value

Users can expose project commands in OpenCode with predictable, configurable names without breaking the plugin's existing discovery and injection workflow.

## Requirements

### Validated

- ✓ Discover commands from Makefile, package scripts, and local skills — existing
- ✓ Load merged user/project plugin config with runtime validation — existing
- ✓ Generate slash commands with source-aware names and source-specific prompt templates — existing

### Active

- [ ] User can globally disable command name prefixes for generated commands
- [ ] User can override prefix behavior per source
- [ ] User can customize prefix text per source using `prefix:name` format
- [ ] Naming collisions caused by prefix removal or customization fall back to source prefix naming automatically
- [ ] Configuration schema, docs, and tests cover the new command-name-prefix behavior

### Out of Scope

- Arbitrary delimiter formats beyond `prefix:name` — keep naming rules consistent in v1 of this feature
- Top-level custom prefix text — global config only controls on/off behavior to keep ownership of prefix strings with each source
- Changing prompt templates or command execution semantics — this milestone is only about generated command names

## Context

The current architecture uses a functional plugin orchestration layer in `src/plugin.ts` and `src/plugin/command-inject.ts`, with one adapter per source under `src/command-sources/`. Configuration is defined in `src/config/schema.ts`, `src/config/types.ts`, and `docs/configuration.md`, then published through `opencode-command-inject.schema.json`. Existing command names are source-prefixed today (`make:<target>`, `<runner>:<script>`, `skill:<name>`), and duplicate names are currently handled with warning-based keep-first behavior during aggregation.

This milestone is brownfield work on top of an already functioning plugin, so the feature must preserve current defaults for existing users, fit the current config structure, and remain compatible with the existing command aggregation pipeline. The design direction chosen during questioning is to keep top-level `command_name_prefix` as a global enable/disable switch only, while source-level config owns optional custom prefix `value` overrides.

## Constraints

- **Compatibility**: Existing users with no new config must keep the current prefixed command naming behavior
- **Configuration Shape**: New settings must fit the existing top-level config plus `sources.<source>` pattern — no separate naming namespace
- **Naming Format**: Custom prefixes must render as `prefix:name`
- **Collision Handling**: If removing or changing prefixes causes a collision, affected commands must fall back to source prefix naming
- **Documentation**: `README.md`, `docs/configuration.md`, and `opencode-command-inject.schema.json` must stay aligned with runtime behavior

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Top-level `command_name_prefix` only controls disable/enable | Global config should not own source-specific prefix strings | — Pending |
| Source-level `command_name_prefix.value` owns custom prefix text | Each source should maintain its own naming identity | — Pending |
| Collision fallback restores source prefix naming | Prevents duplicate slash commands while preserving readable names | — Pending |
| Naming format stays `prefix:name` | Matches current mental model and minimizes migration cost | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check - still the right priority?
3. Audit Out of Scope - reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-26 after initialization*
