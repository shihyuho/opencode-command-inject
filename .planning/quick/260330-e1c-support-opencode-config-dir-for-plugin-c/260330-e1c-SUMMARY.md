---
phase: quick
plan: 260330-e1c
subsystem: config
tags: [config, opencode, env, vitest, docs]
requires: []
provides:
  - plugin-owned config lookup now checks OPENCODE_CONFIG_DIR before XDG and home defaults
  - regression coverage for env-file precedence, directory precedence, and silent fallback behavior
  - docs that separate plugin config-dir lookup from main OpenCode config-file semantics
affects: [src/config/loader.ts, src/config/loader.test.ts, docs/configuration.md]
tech-stack:
  added: []
  patterns: [recoverable config-directory fallback, env precedence regression testing]
key-files:
  created: []
  modified: [src/config/loader.ts, src/config/loader.test.ts, docs/configuration.md]
key-decisions:
  - "Keep OPENCODE_COMMAND_INJECT_CONFIG as the highest-precedence explicit file override."
  - "Treat OPENCODE_CONFIG_DIR as a plugin-owned directory preference that still falls back to XDG and ~/.config when empty."
patterns-established:
  - "Config directory overrides should prefer env input first but continue through existing fallback paths when optional files are absent."
requirements-completed: [CFGDIR-01, CFGDIR-02, CFGDIR-03]
duration: 5 min
completed: 2026-03-30
---

# Quick Task 260330-e1c: Support OPENCODE_CONFIG_DIR for plugin config directory

**Plugin-owned config lookup now honors `OPENCODE_CONFIG_DIR` ahead of XDG and home defaults while preserving the explicit plugin file override and project merge semantics.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-30T02:10:00Z
- **Completed:** 2026-03-30T02:15:16Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added loader support for `OPENCODE_CONFIG_DIR` without changing `OPENCODE_COMMAND_INJECT_CONFIG` precedence.
- Added regression tests for env-file override, directory precedence, XDG/home fallback, and empty custom-directory fallback.
- Documented that plugin-owned config lookup changed while main OpenCode config-file semantics did not.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add plugin-owned config directory resolution with precedence coverage** - `1befb3a` (test), `af415c2` (feat)
2. **Task 2: Document the boundary and run finishing verification** - `4ec2bfc` (docs)

**Plan metadata:** pending

## Files Created/Modified
- `src/config/loader.ts` - resolves plugin config directories with `OPENCODE_CONFIG_DIR` first and default fallbacks after
- `src/config/loader.test.ts` - covers env precedence, directory precedence, home fallback, and missing custom-directory fallback
- `docs/configuration.md` - documents explicit file override vs plugin config directory lookup semantics

## Decisions Made
- Kept `OPENCODE_COMMAND_INJECT_CONFIG` as a file-path override that short-circuits all directory lookup.
- Implemented `OPENCODE_CONFIG_DIR` as a preferred plugin-owned directory, not as a replacement for main OpenCode config-file resolution.
- Preserved silent fallback for missing optional config files while leaving existing `[command-inject]` warnings intact for explicit env-file failures.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Cleaned the RED test harness so only the intended behavior regression failed**
- **Found during:** Task 1
- **Issue:** The first RED run also failed because Vitest could not spy on `os.homedir()` in ESM.
- **Fix:** Switched the home-directory fallback test to drive `os.homedir()` through `HOME` env setup instead of a module spy.
- **Files modified:** `src/config/loader.test.ts`
- **Verification:** `bun run test src/config/loader.test.ts` produced a single expected failure before implementation.
- **Committed in:** `1befb3a`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The auto-fix only corrected test setup so the planned behavior change could be verified accurately.

## Issues Encountered
- Vitest also discovered tests inside a sibling `.worktrees/` checkout during targeted runs, but the current repo verification commands still completed successfully.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Config lookup precedence is pinned in code, tests, and docs.
- Future config-loading changes should keep the explicit env-file override and recoverable fallback contract intact.
