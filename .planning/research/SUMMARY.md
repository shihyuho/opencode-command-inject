# Project Research Summary

**Project:** opencode-command-inject
**Domain:** OpenCode command-injection plugin naming configurability
**Researched:** 2026-03-26
**Confidence:** HIGH

## Executive Summary

This is a brownfield configuration-and-runtime-routing feature for an existing OpenCode plugin, not a greenfield product build. The research is consistent: experts would keep the current TypeScript/Zod/plugin stack, preserve current prefixed command names by default, and insert a dedicated naming-resolution layer between command discovery and hook injection rather than spreading prefix logic across adapters.

The recommended approach is opinionated and low-risk: add `command_name_prefix` as a top-level enable/disable switch, keep source-specific overrides under `sources.<source>.command_name_prefix`, and resolve final names in a centralized planner that computes preferred names first and canonical prefixed fallback names second. This makes collision handling deterministic, preserves current existing-command precedence, and keeps docs/schema/runtime aligned with the repo's current config model.

The main risks are all contract risks, not infrastructure risks: accidentally breaking default names, splitting collision logic across multiple layers, and letting nested config merge semantics or schema/docs drift create confusing behavior. Mitigation is equally clear: freeze `undefined => current prefixed behavior`, centralize resolution before dedupe/injection, test the full collision matrix, and ship schema/docs/runtime updates in the same change.

## Key Findings

### Recommended Stack

Research strongly favors staying on the existing stack for this milestone. The feature is mostly config modeling, name planning, and deterministic conflict handling, so the right move is to extend the current TypeScript + Zod 3 + generated JSON Schema setup rather than broaden scope with dependency or framework changes.

The only meaningful structural addition should be an internal naming module or small set of modules for policy, preferred-name construction, and collision resolution. No database, no new persistence layer, and no new package dependency are justified.

**Core technologies:**
- TypeScript `^5.7.3`: implementation and strict typing — matches the repo's existing baseline and keeps the change local
- `@opencode-ai/plugin` `^1.2.15`: hook integration — no plugin API change is needed because this is an internal naming concern
- Zod `^3.25.0`: runtime config validation — extend the existing schema instead of turning this into a Zod 4 migration
- JSON/JSONC config files: user/project configuration surface — new prefix controls should inherit current merge/precedence behavior
- Generated JSON Schema: editor validation and autocomplete — must be regenerated so schema, docs, and runtime stay synchronized
- Vitest `^3.2.4`: regression and collision-matrix testing — naming behavior is highly testable without new tooling

**Critical version requirements:**
- Stay on Zod 3 for this milestone; defer Zod 4 migration to separate cleanup work
- Keep `zod-to-json-schema` only as the current schema-generation bridge

### Expected Features

The MVP is narrow and well-defined. Users expect configurable naming without any surprise breakage: current prefixed names must remain the default, there must be one global on/off control, each source must be able to override that behavior, and custom source prefix text must still render in the fixed `prefix:name` format.

The non-negotiable safety feature is collision fallback. If disabling or customizing prefixes makes names collide, affected commands should automatically fall back to canonical source-prefixed names instead of disappearing, being silently overwritten, or being renamed opaquely.

**Must have (table stakes):**
- Backward-compatible default naming — no config change means current names keep working
- Global prefix on/off switch — one obvious top-level control
- Per-source override of prefix behavior — source-specific risk management
- Per-source custom prefix text — source-owned naming identity
- Collision-safe fallback — colliding commands recover to canonical prefixed names
- Preserve existing/manual commands over generated ones — current precedence must remain intact
- Clear docs and examples — users must be able to predict final names
- Test coverage for defaults, overrides, collisions, schema, and precedence

**Should have (competitive):**
- Better collision diagnostics explaining requested name vs final fallback name
- Command listing/debug UX that shows original discovered name and final injected name

**Defer (v2+):**
- Reserved-name preflight validation
- Migration aliases from old names to new names
- Arbitrary naming templates or delimiter customization
- Global custom prefix text

### Architecture Approach

The architecture recommendation is unambiguous: introduce a dedicated command-naming layer between source adapters and hook injection. Source adapters should emit stable raw metadata (`sourceId`, `localName`, `canonicalPrefix`, description, template), while a centralized policy + resolver pipeline computes preferred names, applies fallback-to-canonical-prefix rules, and hands only final resolved names to injection/runtime routing.

**Major components:**
1. Config layer and naming policy resolver — parse merged config and derive effective per-source naming rules
2. Source adapters and collector — discover raw commands without owning final slash-command names
3. Name resolver — compute preferred and canonical fallback names from discovered metadata
4. Collision resolver — apply two-pass conflict handling across dynamic and existing commands
5. Hook injection/catalog layer — publish only resolved names and key execution routing by final names

**Key patterns to follow:**
- Separate discovery from naming
- Use a typed policy object instead of inline conditionals
- Resolve names in two passes: preferred first, fallback second
- Keep runtime hooks dumb by consuming already-resolved command names

### Critical Pitfalls

The biggest pitfalls all map directly to roadmap structure. The work fails if it treats naming as a scattered string-formatting tweak rather than a public contract with collision semantics.

1. **Breaking the stable default naming contract** — keep `undefined` equivalent to today's prefixed behavior and add no-config regression tests immediately
2. **Implementing collision fallback in multiple places** — centralize name resolution before any dedupe/injection so source order does not create split-brain behavior
3. **Undefined merge semantics for nested naming config** — specify how global and source-level settings inherit or override, then test user/project/env combinations
4. **Schema, docs, and runtime drifting apart** — update runtime types, Zod schema, generated schema, README, and docs in one coordinated change
5. **Missing the real collision test matrix** — use table-driven tests for source × naming mode × conflict target, including existing-command conflicts and warnings

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Config Contract and Compatibility Guardrails
**Rationale:** This must come first because every later naming rule depends on stable defaults, clear merge semantics, and valid config shapes.
**Delivers:** Top-level `command_name_prefix` boolean contract, source-level `command_name_prefix` object shape, strict prefix validation rules, and no-config compatibility tests.
**Addresses:** Backward-compatible default naming, global prefix on/off, per-source override, per-source custom prefix text.
**Avoids:** Breaking stable defaults, undefined merge semantics, malformed custom prefixes.

### Phase 2: Central Naming Engine
**Rationale:** The core technical risk is split collision logic; a naming engine must exist before any adapter or injection integration change.
**Delivers:** Raw `DiscoveredCommand` outputs, naming policy module, preferred-name builder, canonical fallback builder, and two-pass collision resolver.
**Uses:** Existing TypeScript/Zod stack with a new internal naming module only.
**Implements:** Dedicated naming layer, discovery/naming separation, deterministic collision handling.
**Avoids:** Fallback logic split across aggregator and injection layers, unstable dedupe on intermediate names.

### Phase 3: Hook Integration, Existing-Command Precedence, and Runtime Warnings
**Rationale:** Once names resolve centrally, the plugin orchestration layer can safely consume final names and preserve current existing-command authority.
**Delivers:** `createCommandInjectHooks()` integration, resolved-name execution catalog, dynamic-vs-existing conflict fallback, and actionable warning text.
**Addresses:** Preserve existing/manual commands over generated ones, collision-safe fallback in real startup flow.
**Avoids:** Recomputing names at execute time, inconsistent outcomes between dynamic/dynamic and dynamic/existing collisions.

### Phase 4: Verification, Documentation, and Schema Publication
**Rationale:** This milestone is user-facing configuration work; shipping without full docs/schema/test parity creates support debt immediately.
**Delivers:** Table-driven collision matrix tests, README and `docs/configuration.md` updates, regenerated `opencode-command-inject.schema.json`, and migration-oriented examples.
**Addresses:** Clear docs with examples, full test coverage, schema/editor parity.
**Avoids:** Runtime/schema/docs drift and false confidence from shallow happy-path tests.

### Phase Ordering Rationale

- Config and compatibility rules come first because they define the public contract and merge semantics every later component consumes.
- Naming-engine work comes before hook integration because collision fallback must be resolved on stable raw identities, not on already-finalized command strings.
- Runtime integration follows pure naming modules so the most complex logic is testable in isolation before touching startup orchestration.
- Docs/schema/publication come last, but in the same milestone, because this feature is configuration-heavy and parity failures are one of the top identified risks.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Validate exact merge semantics for nested source-level naming config across user/project/env config paths in the existing loader
- **Phase 3:** Confirm the cleanest warning contract and existing-command fallback behavior in `createCommandInjectHooks()` so diagnostics stay stable and testable

Phases with standard patterns (skip research-phase):
- **Phase 2:** Well-documented internally; architecture research is already decisive on discovery/naming separation and two-pass resolution
- **Phase 4:** Standard repo work; schema regeneration, docs alignment, and matrix testing patterns are already clear

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Based mostly on repository code, package versions, and official Zod/schema sources; recommendation is conservative and low-scope |
| Features | HIGH | Driven by explicit project requirements, current docs/tests, and clear out-of-scope boundaries |
| Architecture | HIGH | Strongly grounded in current repo boundaries and a specific proposed resolution pipeline |
| Pitfalls | HIGH | Derived directly from current duplicate boundaries, config merge behavior, and published contract surfaces |

**Overall confidence:** HIGH

### Gaps to Address

- **Exact nested merge behavior for source-level naming objects:** confirm whether partial source overrides should inherit or replace sibling fields in the current deep-merge loader, then encode that in tests
- **Warning-text contract:** decide how explicit fallback warnings should be so users understand collisions without creating brittle or noisy logs
- **Canonical prefix for npm scripts:** verify whether fallback should always use the detected runner token exactly as today when custom prefixes collide

## Sources

### Primary (HIGH confidence)
- Repository sources: `src/config/types.ts`, `src/config/schema.ts`, `src/config/loader.ts`, `src/command-sources/aggregator.ts`, `src/command-sources/*.ts`, `src/plugin/command-inject.ts`, `src/plugin/command-inject.test.ts`, `scripts/generate-schema.ts`, `package.json` — current behavior, boundaries, and test coverage
- `.planning/PROJECT.md` — milestone requirements, constraints, and out-of-scope decisions
- `README.md`, `docs/configuration.md`, `opencode-command-inject.schema.json` — published configuration contract and user-facing defaults
- Zod docs: https://zod.dev/json-schema and Context7 `/colinhacks/zod/v3.24.2`, `/colinhacks/zod/v4.0.1` — schema-generation and object behavior context
- OpenCode plugin docs via Context7 `/websites/opencode_ai_plugins` and https://opencode.ai/docs/plugins/index — plugin hook model
- JSON Schema reference: https://json-schema.org/understanding-json-schema/reference/annotations — default semantics and schema behavior
- Semantic Versioning 2.0.0: https://semver.org/ — compatibility framing for command-name contract changes

### Secondary (MEDIUM confidence)
- `zod-to-json-schema` README — current deprecation state and continued suitability as temporary bridge
- https://oclif.io/docs/command_discovery_strategies — confirms colon-separated command naming as standard CLI practice
- https://github.com/google-gemini/gemini-cli/pull/5130 — example of centralized collision handling and secondary-collision testing needs
- https://github.com/anthropics/claude-code/issues/22517 — user expectations around prefixed command namespaces
- https://github.com/openclaw/openclaw/issues/38302 — prefix configurability as disambiguation, not free-form formatting

### Tertiary (LOW confidence)
- None material. Remaining uncertainty is implementation-specific, not source-quality driven.

---
*Research completed: 2026-03-26*
*Ready for roadmap: yes*
