# Phase 2 Research: Collision-Safe Naming

**Date:** 2026-03-26
**Phase:** 02-collision-safe-naming
**Requirements:** SAFE-02, SAFE-03, SAFE-04

## Summary

Phase 2 should keep the existing Phase 1 name builder as the source of customized-vs-canonical naming, then add a collision-resolution layer at the two existing duplicate gates:

1. `src/command-sources/aggregator.ts` for dynamic-source collisions
2. `src/plugin/command-inject.ts` for dynamic-vs-existing command/config collisions

The safest approach is to enrich command metadata with canonical/customized names and source identity, then resolve only collision groups introduced by prefix customization. If canonical fallback still collides, retain the current deterministic keep-first behavior and emit an explicit warning that canonical fallback was attempted.

## Affected Files / Seams

### Runtime seams
- `src/command-sources/command-name-prefix.ts`
  - Current single source of truth for canonical vs customized command names.
  - Best seam for returning richer naming metadata instead of only a string.
- `src/command-sources/types.ts`
  - `CommandInfo` needs collision-planning metadata if fallback resolution happens after source loading.
- `src/command-sources/makefile-source.ts`
- `src/command-sources/npm-scripts-source.ts`
- `src/command-sources/skill-source.ts`
  - Must preserve current emitted names while also attaching canonical naming metadata for fallback.
- `src/command-sources/aggregator.ts`
  - Existing cross-source keep-first warning site.
  - Must become collision-group aware for D-01, D-04, D-05, D-07, D-08, D-09, D-10, D-11.
- `src/plugin/command-inject.ts`
  - Existing dynamic-vs-existing keep-first warning site.
  - Must apply the same fallback logic without overwriting existing/config commands.

### Test seams
- `src/command-sources/command-name-prefix.test.ts`
- `src/command-sources/aggregator.test.ts`
- `src/plugin/command-inject.test.ts`
- Potentially source-specific tests if metadata generation is complex:
  - `src/command-sources/makefile-source.test.ts`
  - `src/command-sources/npm-scripts-source.test.ts`
  - `src/command-sources/skill-source.test.ts`

## Recommended Implementation Approach

## 1. Preserve `buildCommandName` as the naming authority

Do not duplicate prefix logic in aggregator/plugin layers. Instead, extract or extend `buildCommandName` so source adapters can compute both:

- `canonicalName` — always `canonicalPrefix:name`
- `configuredName` — current Phase 1 output
- `usedCustomizedName` — boolean indicating whether `configuredName !== canonicalName`

This avoids re-implementing Phase 1 precedence rules and respects D-02 / D-03.

## 2. Attach metadata to each dynamic command

Extend `CommandInfo` (or introduce a dynamic-command subtype) with at least:

- `sourceId`
- `canonicalName`
- `configuredName` or final emitted `name`
- `usedCustomizedName`

This metadata lets later collision resolution answer:

- did customization cause the collision?
- what canonical fallback name should each command use?
- which source(s) participate in the warning?

## 3. Resolve collisions by group, not one command at a time

Both collision sites should operate on grouped commands keyed by the currently configured `name`.

For each collision group:

1. If every colliding command would still collide at canonical names, keep existing keep-first behavior (D-10, D-11).
2. If the collision existed even without Phase 1 customization, keep existing keep-first behavior (D-03).
3. If the collision is newly introduced by customization, rename the whole group to canonical names together (D-04, D-05, D-06).

This group-based resolver is required because partially falling back one item would violate D-05.

## Collision Detection Strategy

Use this decision test for a collision group with current name `X`:

### Collision is "introduced by prefix customization" when:
- at least two commands currently share `name === X`, and
- at least one command in the group has `usedCustomizedName === true`, and
- the group would not collide under the baseline names that exist without Phase 1 customization.

### Baseline names to compare against
- For dynamic-source collisions: compare the group's `canonicalName` values against each other.
- For dynamic-vs-existing collisions: compare each dynamic command's `canonicalName` against existing command/config names.

### Practical rule matching the locked decisions
- If current configured names collide, but canonical names are unique and do not collide with existing commands, fallback applies.
- If canonical names still collide, fallback was attempted but unresolved; keep-first remains.
- If a dynamic command already collides with an existing command at canonical naming, treat that as pre-existing and keep current keep-first behavior.

This directly implements D-02, D-03, D-10, D-11.

## Warning Contract Guidance

### Dynamic-source collisions (`src/command-sources/aggregator.ts`)
- Prefix: `[command-sources]`
- Emit one warning per collision group (D-07)
- Warning content should include:
  - collided configured name
  - participating source IDs
  - final canonical fallback names per source

Example shape:
- `[command-sources] customized command name collision on 'build' across makefile, npm-scripts; falling back to canonical names: makefile -> make:build, npm-scripts -> pnpm:build`

### Dynamic-vs-existing collisions (`src/plugin/command-inject.ts`)
- Prefix: `[command-inject]`
- Emit one warning per collision group (D-07)
- Warning content should include:
  - collided configured name
  - dynamic source(s) involved
  - existing/config command presence
  - final canonical fallback names assigned to dynamic commands

Example shape:
- `[command-inject] customized command name collision on 'build' with existing command; falling back to canonical names: makefile -> make:build`

### Unresolved canonical fallback case
If canonical fallback is attempted and still cannot produce unique names:
- emit the same layer-appropriate prefix
- explicitly state canonical fallback was attempted
- explicitly state final behavior is keep-first

Example shape:
- `[command-sources] customized command name collision on 'build'; attempted canonical fallback but names still collide, keeping first command`

## Testing Strategy

## Priority test files

### `src/command-sources/aggregator.test.ts`
Add focused unit tests for:
- collision introduced by prefix removal across two dynamic sources falls back both commands to canonical names
- collision introduced by custom prefix value falls back the whole collision group, not one command
- unrelated commands in the same sources keep configured names
- canonical fallback still collides -> keep-first warning remains, with attempted-fallback wording
- pre-existing canonical collision -> no Phase 2 fallback path, just existing keep-first behavior

### `src/plugin/command-inject.test.ts`
Add integration tests for:
- dynamic command colliding with existing command because prefixes were disabled -> injected command falls back to canonical name and existing command is preserved
- dynamic command colliding with config-defined command -> config command still wins, dynamic command only injects if canonical fallback becomes unique
- mixed multi-source scenario proving only the actual collision group falls back while other commands remain customized
- warning prefix stays `[command-inject]`

### `src/command-sources/command-name-prefix.test.ts`
If helper contract changes, add tests proving metadata for:
- canonical default naming
- global disable raw names
- explicit source force-on with custom value
- distinction between canonical and customized outputs for later collision detection

## Suggested verification commands
- `bunx vitest run src/command-sources/aggregator.test.ts src/plugin/command-inject.test.ts src/command-sources/command-name-prefix.test.ts`
- `bun run test`

## Risks / Pitfalls

1. **Do not re-implement Phase 1 precedence in multiple places**
   - Recomputing canonical/customized names outside `command-name-prefix.ts` risks divergence.

2. **Do not let fallback rename unrelated commands**
   - Fallback must stay group-scoped (D-04, D-06).

3. **Do not overwrite existing commands or config-defined commands**
   - `src/plugin/command-inject.ts` must preserve current protection behavior even when fallback is attempted.

4. **Skill-source local duplicate handling may hide some collisions before aggregation**
   - Phase 2 should not redesign source-local duplicate behavior unless necessary for metadata consistency.

5. **Warning text should stay stable enough for tests but not overspecified in runtime logic**
   - Test key substrings: collided name, source IDs, fallback names, attempted canonical fallback wording.

## What Must Stay True

- Missing files, parse failures, and discovery issues remain recoverable warnings, not crashes.
- Manual/existing/config commands continue to beat injected commands.
- Warning prefixes remain `[command-sources]` and `[command-inject]` at their existing ownership boundaries.
- Phase 2 introduces no second renaming scheme beyond canonical fallback.
- If later work touches `src/config/types.ts` or `src/config/schema.ts`, the plan must include `bun run generate-schema`; this phase does not appear to require config changes.

## Validation Architecture

The verification surface for this phase is behavior-heavy and should center on automated tests plus grep-able warning assertions:

- dynamic collision groups resolve to canonical names only when customization introduced the collision
- canonical fallback warnings are summarized once per group
- unresolved canonical fallback still logs attempted-fallback wording and keeps first
- plugin-level existing/config commands are never overwritten

This is sufficient for plan-level must-haves and checker validation.
