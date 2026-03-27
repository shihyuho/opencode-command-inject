---
phase: 01-prefix-controls-safe-defaults
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/config/types.ts
  - src/config/index.ts
  - src/config/schema.ts
  - src/config/schema.test.ts
  - src/config/loader.test.ts
  - src/command-sources/types.ts
  - src/command-sources/command-name-prefix.ts
  - src/command-sources/command-name-prefix.test.ts
  - opencode-command-inject.schema.json
autonomous: true
requirements:
  - PFX-01
  - PFX-02
  - PFX-03
must_haves:
  truths:
    - "Config accepts global prefix disable and per-source prefix override/value settings without changing unrelated source fields."
    - "User and project config can deep-merge nested per-source prefix settings instead of replacing entire source objects."
    - "A shared helper can derive canonical, raw, or custom-prefixed names from one consistent decision table."
  artifacts:
    - path: "src/config/types.ts"
      provides: "Typed top-level and source-level prefix config contract"
      contains: "command_name_prefix"
    - path: "src/config/schema.ts"
      provides: "Runtime validation for prefix config"
      contains: "command_name_prefix"
    - path: "src/command-sources/command-name-prefix.ts"
      provides: "Shared name-resolution helper for source adapters"
      exports: ["buildCommandName"]
  key_links:
    - from: "src/config/types.ts"
      to: "src/config/schema.ts"
      via: "matching command_name_prefix fields"
      pattern: "command_name_prefix"
    - from: "src/config/loader.test.ts"
      to: "src/config/loader.ts"
      via: "deep merge assertions for nested source config"
      pattern: "command_name_prefix"
    - from: "src/command-sources/command-name-prefix.test.ts"
      to: "src/command-sources/command-name-prefix.ts"
      via: "decision-table tests"
      pattern: "buildCommandName"
---

<objective>
Establish the Phase 1 prefix-control contract before any source adapter changes.

Purpose: Lock the config shape and one reusable name-resolution rule set so downstream implementation does not drift across sources.
Output: Typed/schema-validated prefix config plus a tested shared helper for effective command-name derivation.
</objective>

<execution_context>
@$HOME/.config/opencode/get-shit-done/workflows/execute-plan.md
@$HOME/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-prefix-controls-safe-defaults/01-CONTEXT.md
@.planning/phases/01-prefix-controls-safe-defaults/01-RESEARCH.md
@/Users/matt/code/github.com/softleader/agent-skills.wiki/GSD-Guide.md
@src/config/types.ts
@src/config/schema.ts
@src/config/loader.ts
@src/config/schema.test.ts
@src/config/loader.test.ts
@src/command-sources/types.ts

<interfaces>
From src/config/types.ts:
```ts
export interface SourceConfig {
  disable?: boolean
  prompt?: string
  prompt_append?: string
}

export interface CommandInjectConfig {
  sources?: {
    makefile?: SourceConfig
    "npm-scripts"?: SourceConfig
    skill?: SourceConfig
  }
}
```

From src/command-sources/types.ts:
```ts
export interface CommandInfo {
  name: string
  description: string
  template: string
}
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Extend the prefix configuration contract</name>
  <files>src/config/types.ts, src/config/index.ts, src/config/schema.ts, src/config/schema.test.ts, src/config/loader.test.ts, opencode-command-inject.schema.json</files>
  <read_first>/Users/matt/code/github.com/softleader/agent-skills.wiki/GSD-Guide.md, src/config/types.ts, src/config/index.ts, src/config/schema.ts, src/config/schema.test.ts, src/config/loader.test.ts, scripts/generate-schema.ts, .planning/phases/01-prefix-controls-safe-defaults/01-CONTEXT.md</read_first>
  <behavior>
    - Test 1: top-level `command_name_prefix.disable` parses successfully per D-01.
    - Test 2: source-level `command_name_prefix.disable` and `command_name_prefix.value` parse successfully per D-02 and D-10.
    - Test 3: top-level `command_name_prefix.value` is rejected so custom text stays source-owned per D-01.
    - Test 4: user/project config deep-merges nested `sources.<source>.command_name_prefix` data per D-03.
  </behavior>
  <action>Before touching repo code, update `/Users/matt/code/github.com/softleader/agent-skills.wiki/GSD-Guide.md` to note that this repo's GSD executions must sync the local wiki before start and before completion. Then add `CommandNamePrefixConfig` to `src/config/types.ts` with exact fields `disable?: boolean` and `value?: string`. Add top-level `command_name_prefix?: { disable?: boolean }` to `CommandInjectConfig` per D-01. Add `command_name_prefix?: CommandNamePrefixConfig` to `SourceConfig` so sources can express inherit / force-on / force-off plus optional custom `value` per D-02 and D-10. Mirror the same field names in `src/config/schema.ts`; allow `value` only inside `sources.<source>.command_name_prefix`, not at the top level. Update `src/config/index.ts` exports if the new types are needed downstream. Extend `src/config/schema.test.ts` with explicit valid and invalid cases for the new fields. Extend `src/config/loader.test.ts` with a user-config + project-config merge case proving nested `command_name_prefix` fields merge without dropping sibling source settings per D-03. Before closing the task, run `bun run generate-schema` and update `opencode-command-inject.schema.json` immediately so the repo never contains changed schema/types without the published schema artifact required by AGENTS.md.</action>
  <acceptance_criteria>
    - `src/config/types.ts` contains `export interface CommandNamePrefixConfig`.
    - `src/config/types.ts` contains top-level `command_name_prefix?: { disable?: boolean }` on `CommandInjectConfig`.
    - `src/config/types.ts` contains `command_name_prefix?: CommandNamePrefixConfig` on `SourceConfig`.
    - `src/config/schema.ts` contains `command_name_prefix` in both top-level and source-level schema definitions.
    - `src/config/schema.test.ts` contains a failing-case assertion for top-level `command_name_prefix.value`.
    - `src/config/loader.test.ts` asserts nested `command_name_prefix` merge behavior.
    - `opencode-command-inject.schema.json` contains `command_name_prefix` after regeneration.
    - `/Users/matt/code/github.com/softleader/agent-skills.wiki/GSD-Guide.md` mentions the repo-specific GSD wiki-sync rule.
  </acceptance_criteria>
  <verify>
    <automated>bunx vitest run src/config/schema.test.ts src/config/loader.test.ts && bun run generate-schema</automated>
  </verify>
  <done>Prefix config is represented consistently in types, runtime schema, merge tests, and the published JSON schema without introducing a top-level custom prefix string.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Create one tested command-name decision helper</name>
  <files>src/command-sources/types.ts, src/command-sources/command-name-prefix.ts, src/command-sources/command-name-prefix.test.ts</files>
  <read_first>src/command-sources/types.ts, .planning/phases/01-prefix-controls-safe-defaults/01-CONTEXT.md, .planning/phases/01-prefix-controls-safe-defaults/01-RESEARCH.md</read_first>
  <behavior>
    - Test 1: helper returns `canonicalPrefix:name` when prefixing is effectively on.
    - Test 2: helper returns raw `name` when global disable or source force-off disables prefixing.
    - Test 3: helper returns `value:name` when source force-on or inherited-on uses a custom value per D-10.
    - Test 4: helper ignores `value` when global prefixing is off and source does not explicitly force-on per D-04 and D-05.
  </behavior>
  <action>Create `src/command-sources/command-name-prefix.ts` exporting `buildCommandName(options)` and any local option types needed by the source adapters. The helper must accept the raw command name, canonical prefix string, top-level prefix config, and the source config. Implement the exact decision table from D-04 through D-06 and D-10: source `disable: true` => raw name; source `disable: false` with no `value` => canonical prefix; source `disable: false` with `value` => `value:name`; inherited state uses global `command_name_prefix.disable`; value-only while global disable is true returns raw name silently. Add `src/command-sources/command-name-prefix.test.ts` covering canonical, raw, custom, and ignored-value cases. Update `src/command-sources/types.ts` only if you need to re-export new prefix-related types for downstream adapters.</action>
  <acceptance_criteria>
    - `src/command-sources/command-name-prefix.ts` exports `buildCommandName`.
    - `src/command-sources/command-name-prefix.test.ts` covers canonical, unprefixed, custom-prefix, and ignored-value branches.
    - Helper logic includes the exact strings `disable` and `value` from the new config shape.
  </acceptance_criteria>
  <verify>
    <automated>bunx vitest run src/command-sources/command-name-prefix.test.ts</automated>
  </verify>
  <done>All Phase 1 prefix rules are encoded once in a shared helper with tests proving the decision table before any source-specific wiring begins.</done>
</task>

</tasks>

<verification>
Run the config and helper tests together, then confirm schema regeneration: `bunx vitest run src/config/schema.test.ts src/config/loader.test.ts src/command-sources/command-name-prefix.test.ts && bun run generate-schema`. Before writing the summary, sync `/Users/matt/code/github.com/softleader/agent-skills.wiki/GSD-Guide.md` one more time per AGENTS.md.
</verification>

<success_criteria>
- Types and schema expose the Phase 1 prefix-control contract exactly as locked in CONTEXT.md.
- Deep-merge coverage proves nested source prefix settings preserve existing user/project layering.
- A single tested helper exists for source adapters to consume in the next plan.
- `opencode-command-inject.schema.json` is regenerated in the same wave that changes `src/config/types.ts` / `src/config/schema.ts`.
- Local GSD wiki guidance is synced before execution starts and again before the plan summary is reported.
</success_criteria>

<output>
After completion, create `.planning/phases/01-prefix-controls-safe-defaults/01-prefix-controls-safe-defaults-01-SUMMARY.md`
</output>
