---
phase: 02-collision-safe-naming
plan: 02
subsystem: api
tags: [vitest, plugin, collisions, fallback, integration]
requires:
  - phase: 02-collision-safe-naming-01
    provides: canonical naming metadata and source-layer collision fallback
provides:
  - plugin-layer fallback against existing and config-defined commands
  - integration proof that customized collision groups stay reachable
  - end-to-end warning coverage for canonical fallback outcomes
affects: [phase-3-docs-and-regression, plugin-hooks, collision-handling]
tech-stack:
  added: []
  patterns: [plugin duplicate gates reuse canonical metadata, config collisions keep overwrite guards while renaming dynamic commands first]
key-files:
  created: []
  modified: [src/plugin/command-inject.ts, src/plugin/command-inject.test.ts, src/command-sources/makefile-source.ts, src/command-sources/npm-scripts-source.ts, src/command-sources/skill-source.ts, src/command-sources/makefile-source.test.ts, src/command-sources/npm-scripts-source.test.ts]
key-decisions:
  - "Plugin injection now attempts canonical fallback before giving up to existing/config command precedence, using the source metadata introduced in plan 01."
  - "Config-command collisions still flow through the existing overwrite guard after any canonical rename attempt, preserving current behavior on unresolved duplicates."
patterns-established:
  - "When command metadata shape changes, source adapter tests must assert the carried metadata instead of assuming string-only command records."
  - "Plugin collision warnings should name the collided configured command and the final canonical names assigned to dynamic sources."
requirements-completed: [SAFE-02, SAFE-03, SAFE-04]
duration: 11min
completed: 2026-03-26
---

# Phase 2 Plan 02: Collision-Safe Naming Summary

**Plugin-layer canonical fallback now preserves generated commands through existing/config collisions and proves the warning contract with integration coverage.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-03-26T17:11:30Z
- **Completed:** 2026-03-26T17:17:24Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Added plugin-layer collision handling that falls customized dynamic commands back to canonical source-prefixed names instead of silently losing them to existing/config commands.
- Wired canonical fallback metadata through makefile, npm-scripts, and skill sources so plugin injection can classify prefix-caused collisions correctly.
- Added integration and regression coverage for existing-command collisions, config-command collisions, mixed-source cases, and attempted-fallback warnings.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add plugin-layer canonical fallback against existing and config-defined commands** - `352d45f` (feat)
2. **Task 2: Prove plugin-layer fallback, warnings, and no-overwrite guarantees with integration tests** - `dfd8fbb` (test)

## Files Created/Modified
- `src/plugin/command-inject.ts` - resolves customized dynamic collisions against existing/config command names before injection
- `src/plugin/command-inject.test.ts` - covers successful fallback, unresolved fallback, and mixed collision groups
- `src/command-sources/makefile-source.ts` - forwards canonical naming metadata with emitted make commands
- `src/command-sources/npm-scripts-source.ts` - forwards canonical naming metadata with emitted npm script commands
- `src/command-sources/skill-source.ts` - forwards canonical naming metadata with emitted skill commands
- `src/command-sources/makefile-source.test.ts` - asserts metadata-bearing make command records
- `src/command-sources/npm-scripts-source.test.ts` - asserts metadata-bearing npm script command records

## Decisions Made
- Reused the metadata from Plan 01 at the plugin boundary instead of recomputing canonical names from config/existing collisions.
- Kept config overwrite protection unchanged and only improved the dynamic command naming step that runs before config assignment.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Forwarded canonical metadata through source adapters and updated affected source tests**
- **Found during:** Task 1 and Task 2 verification
- **Issue:** Plan 01 introduced metadata on the naming helper, but source adapters still emitted string-only command records and their exact-equality tests failed once plugin integration needed the new fields end-to-end.
- **Fix:** Attached `sourceId`, `canonicalName`, and `usedCustomizedName` in makefile/npm-scripts/skill sources and updated source adapter tests to assert the metadata-bearing command shape.
- **Files modified:** `src/command-sources/makefile-source.ts`, `src/command-sources/npm-scripts-source.ts`, `src/command-sources/skill-source.ts`, `src/command-sources/makefile-source.test.ts`, `src/command-sources/npm-scripts-source.test.ts`
- **Verification:** `bunx vitest run src/plugin/command-inject.test.ts src/command-sources/aggregator.test.ts && bun run test`
- **Committed in:** `352d45f`, `dfd8fbb`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required to make plugin-layer fallback work end-to-end with real source outputs. No scope creep beyond the Phase 2 runtime contract.

## Issues Encountered
- Full-suite source tests initially failed because metadata-carrying command objects invalidated older exact object expectations; updating those tests restored coverage for the new runtime contract.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 2 runtime behavior is now complete at both duplicate gates, so Phase 3 can document the final fallback behavior and broaden regression coverage.
- Published docs can now describe canonical fallback warnings with confidence because both source-layer and plugin-layer tests cover the user-visible outcomes.

## Self-Check

PASSED
- FOUND: `.planning/phases/02-collision-safe-naming/02-collision-safe-naming-02-SUMMARY.md`
- FOUND: `352d45f`
- FOUND: `dfd8fbb`

---
*Phase: 02-collision-safe-naming*
*Completed: 2026-03-26*
