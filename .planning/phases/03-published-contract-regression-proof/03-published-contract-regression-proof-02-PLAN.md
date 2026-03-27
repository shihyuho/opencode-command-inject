---
phase: 03-published-contract-regression-proof
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - src/command-sources/command-name-prefix.test.ts
  - src/command-sources/aggregator.test.ts
  - src/plugin/command-inject.test.ts
autonomous: true
requirements:
  - TEST-01
  - TEST-02
  - TEST-03
  - TEST-04
must_haves:
  truths:
    - "Maintainer can run automated tests proving no-config defaults still keep canonical prefixed names."
    - "Maintainer can run automated tests proving global disable and per-source override/custom prefix behavior."
    - "Maintainer can run automated tests proving collision fallback and warning ownership at both duplicate gates."
  artifacts:
    - path: "src/command-sources/command-name-prefix.test.ts"
      provides: "Pure naming-policy regression coverage"
      contains: "configuredName"
    - path: "src/command-sources/aggregator.test.ts"
      provides: "Source-layer collision fallback regression coverage"
      contains: "[command-sources]"
    - path: "src/plugin/command-inject.test.ts"
      provides: "End-to-end prefix and collision regression coverage"
      contains: "[command-inject]"
  key_links:
    - from: "src/command-sources/command-name-prefix.test.ts"
      to: "src/command-sources/command-name-prefix.ts"
      via: "default/override/custom naming assertions"
      pattern: "configuredName|canonicalName"
    - from: "src/command-sources/aggregator.test.ts"
      to: "src/command-sources/aggregator.ts"
      via: "collision-group fallback warnings"
      pattern: "customized command name collision|attempted canonical fallback"
    - from: "src/plugin/command-inject.test.ts"
      to: "src/plugin/command-inject.ts"
      via: "existing/config precedence plus canonical fallback"
      pattern: "keeping existing|customized command name collision"
---

<objective>
Turn the Phase 1/2 naming behavior into explicit automated regression proof.

Purpose: Give maintainers a fast, requirement-mapped test surface that proves the published contract will not silently drift.
Output: Focused test coverage for defaults, overrides, custom prefixes, and collision fallback warnings.
</objective>

<execution_context>
@$HOME/.config/opencode/get-shit-done/workflows/execute-plan.md
@$HOME/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/03-published-contract-regression-proof/03-RESEARCH.md
@.planning/phases/03-published-contract-regression-proof/03-VALIDATION.md
@.planning/phases/01-prefix-controls-safe-defaults/01-prefix-controls-safe-defaults-02-SUMMARY.md
@.planning/phases/02-collision-safe-naming/02-collision-safe-naming-01-SUMMARY.md
@.planning/phases/02-collision-safe-naming/02-collision-safe-naming-02-SUMMARY.md
@/Users/matt/code/github.com/softleader/agent-skills.wiki/GSD-Guide.md
@src/command-sources/command-name-prefix.test.ts
@src/command-sources/aggregator.test.ts
@src/plugin/command-inject.test.ts

<interfaces>
From src/command-sources/command-name-prefix.ts:
```ts
export function buildCommandName(options: BuildCommandNameOptions): {
  configuredName: string
  canonicalName: string
  usedCustomizedName: boolean
}
```

From src/command-sources/types.ts:
```ts
export interface CommandInfo {
  name: string
  description: string
  template: string
  sourceId?: string
  canonicalName?: string
  usedCustomizedName?: boolean
}
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Make prefix behavior requirements explicit in focused regression tests</name>
  <files>src/command-sources/command-name-prefix.test.ts, src/plugin/command-inject.test.ts</files>
  <read_first>/Users/matt/code/github.com/softleader/agent-skills.wiki/GSD-Guide.md, src/command-sources/command-name-prefix.test.ts, src/plugin/command-inject.test.ts, .planning/phases/03-published-contract-regression-proof/03-RESEARCH.md, .planning/phases/01-prefix-controls-safe-defaults/01-prefix-controls-safe-defaults-02-SUMMARY.md</read_first>
  <behavior>
    - Test 1: no-config behavior keeps canonical names like `make:build`, `pnpm:test`, and `skill:review`.
    - Test 2: top-level disable removes prefixes unless a source explicitly forces canonical/custom behavior back on.
    - Test 3: per-source custom values render `prefix:name` outputs and preserve nested skill namespaces where applicable.
  </behavior>
  <action>Restructure or extend `src/command-sources/command-name-prefix.test.ts` and `src/plugin/command-inject.test.ts` so TEST-01, TEST-02, and TEST-03 are easy to trace from test names and assertions. Keep existing passing behavior, but make sure the suite clearly covers: default compatibility with no config; global disable with source-specific force-on; and custom per-source prefix values producing `prefix:name`. Prefer adding or renaming focused `describe` / `it` blocks over duplicating large fixture setups. Preserve the repo’s current runtime contract: skill raw names drop only the outer `skill:` prefix, and plugin-level tests must prove real config propagation rather than only pure helper behavior.</action>
  <acceptance_criteria>
    - `src/command-sources/command-name-prefix.test.ts` contains explicit default, disable, and custom-prefix coverage.
    - `src/plugin/command-inject.test.ts` contains at least one no-config compatibility assertion and one mixed global-disable/per-source-override assertion.
    - Test names or inline comments make TEST-01, TEST-02, and TEST-03 traceable without reading Phase docs.
  </acceptance_criteria>
  <verify>
    <automated>bunx vitest run src/command-sources/command-name-prefix.test.ts src/plugin/command-inject.test.ts</automated>
  </verify>
  <done>Maintainers can point to fast automated tests proving the naming contract for defaults, overrides, and custom values.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Prove collision fallback and warning ownership as regression guarantees</name>
  <files>src/command-sources/aggregator.test.ts, src/plugin/command-inject.test.ts</files>
  <read_first>/Users/matt/code/github.com/softleader/agent-skills.wiki/GSD-Guide.md, src/command-sources/aggregator.test.ts, src/plugin/command-inject.test.ts, .planning/phases/03-published-contract-regression-proof/03-RESEARCH.md, .planning/phases/02-collision-safe-naming/02-collision-safe-naming-01-SUMMARY.md, .planning/phases/02-collision-safe-naming/02-collision-safe-naming-02-SUMMARY.md</read_first>
  <behavior>
    - Test 1: source-layer customized collisions fall back to canonical names and warn with `[command-sources]`.
    - Test 2: plugin-layer collisions against existing/config commands fall back where possible, keep precedence where necessary, and warn with `[command-inject]`.
    - Test 3: unresolved canonical fallback still reports attempted fallback wording and deterministic keep-first behavior.
  </behavior>
  <action>Extend `src/command-sources/aggregator.test.ts` and `src/plugin/command-inject.test.ts` so TEST-04 is unmistakably covered at both duplicate gates. Keep one warning-owner split: source-layer assertions must match `[command-sources]`, while plugin-layer assertions must match `[command-inject]`. Include successful fallback cases plus unresolved canonical fallback cases using the existing runtime wording patterns (`customized command name collision`, `attempted canonical fallback`, `keeping first` or `keeping existing`). Do not add new runtime behavior; only tighten regression proof around the shipped Phase 2 contract.</action>
  <acceptance_criteria>
    - `src/command-sources/aggregator.test.ts` asserts `[command-sources]` and canonical fallback output names.
    - `src/plugin/command-inject.test.ts` asserts `[command-inject]` and preserves existing/config command precedence.
    - Both test files include attempted-fallback wording for unresolved canonical collisions.
    - Running the full suite still passes after the regression test tightening.
  </acceptance_criteria>
  <verify>
    <automated>bunx vitest run src/command-sources/aggregator.test.ts src/plugin/command-inject.test.ts && bun run test</automated>
  </verify>
  <done>Collision fallback and warning ownership are protected by automated tests that future maintainers can run as fast regression checks and full-suite proof.</done>
</task>

</tasks>

<verification>
Run `bunx vitest run src/command-sources/command-name-prefix.test.ts src/command-sources/aggregator.test.ts src/plugin/command-inject.test.ts`, then run `bun run test`. Before writing the summary, sync `/Users/matt/code/github.com/softleader/agent-skills.wiki/GSD-Guide.md` again per AGENTS.md.
</verification>

<success_criteria>
- Automated tests map directly to TEST-01 through TEST-04.
- Default compatibility, override/custom-prefix behavior, and collision fallback warnings all have focused regression coverage.
- Source-layer and plugin-layer warning ownership remain separately asserted.
</success_criteria>

<output>
After completion, create `.planning/phases/03-published-contract-regression-proof/03-published-contract-regression-proof-02-SUMMARY.md`
</output>
