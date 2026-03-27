---
phase: 03-published-contract-regression-proof
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - README.md
  - docs/configuration.md
  - src/config/types.ts
  - src/config/schema.ts
  - src/config/schema.test.ts
  - src/config/types.test.ts
  - opencode-command-inject.schema.json
autonomous: true
requirements:
  - CONF-01
  - CONF-02
  - CONF-03
must_haves:
  truths:
    - "User can discover the top-level and per-source prefix settings from the published JSON schema."
    - "User can learn default naming, global disable, per-source override, and custom prefix usage from README.md."
    - "User can read one authoritative configuration document that explains precedence, examples, and collision fallback behavior."
  artifacts:
    - path: "opencode-command-inject.schema.json"
      provides: "Published JSON Schema containing prefix controls"
      contains: "command_name_prefix"
    - path: "README.md"
      provides: "Quick-start documentation for prefix controls and fallback behavior"
      contains: "command_name_prefix"
    - path: "docs/configuration.md"
      provides: "Detailed configuration reference with precedence and examples"
      contains: "collision fallback"
  key_links:
    - from: "src/config/schema.ts"
      to: "opencode-command-inject.schema.json"
      via: "bun run generate-schema"
      pattern: "command_name_prefix"
    - from: "README.md"
      to: "docs/configuration.md"
      via: "configuration examples and link"
      pattern: "command_name_prefix|collision fallback"
    - from: "src/config/types.ts"
      to: "src/config/schema.ts"
      via: "matching top-level and source-level config fields"
      pattern: "command_name_prefix"
---

<objective>
Publish the finalized naming-config contract across schema and docs.

Purpose: Make the Phase 1/2 behavior discoverable and trustworthy for users without changing the shipped runtime rules.
Output: Aligned schema/types/tests plus refreshed README and configuration documentation.
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
@.planning/phases/01-prefix-controls-safe-defaults/01-prefix-controls-safe-defaults-01-SUMMARY.md
@.planning/phases/01-prefix-controls-safe-defaults/01-prefix-controls-safe-defaults-02-SUMMARY.md
@.planning/phases/02-collision-safe-naming/02-collision-safe-naming-01-SUMMARY.md
@.planning/phases/02-collision-safe-naming/02-collision-safe-naming-02-SUMMARY.md
@/Users/matt/code/github.com/softleader/agent-skills.wiki/GSD-Guide.md
@README.md
@docs/configuration.md
@src/config/types.ts
@src/config/schema.ts
@src/config/schema.test.ts
@src/config/types.test.ts
@opencode-command-inject.schema.json

<interfaces>
From src/config/types.ts:
```ts
export interface CommandNamePrefixConfig {
  disable?: boolean
  value?: string
}

export interface SourceConfig {
  disable?: boolean
  prompt?: string
  prompt_append?: string
  command_name_prefix?: CommandNamePrefixConfig
}

export interface CommandInjectConfig {
  command_name_prefix?: {
    disable?: boolean
  }
  sources?: {
    makefile?: SourceConfig
    "npm-scripts"?: SourceConfig
    skill?: SourceConfig
  }
}
```

From src/config/schema.ts:
```ts
export const CommandInjectConfigSchema = z.object({
  command_name_prefix: TopLevelCommandNamePrefixConfigSchema.optional(),
  sources: z.object({
    makefile: SourceConfigSchema.optional(),
    "npm-scripts": SourceConfigSchema.optional(),
    skill: SourceConfigSchema.optional(),
  }).strict().optional(),
}).strict()
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Lock the published schema contract to the shipped prefix behavior</name>
  <files>src/config/types.ts, src/config/schema.ts, src/config/schema.test.ts, src/config/types.test.ts, opencode-command-inject.schema.json</files>
  <read_first>/Users/matt/code/github.com/softleader/agent-skills.wiki/GSD-Guide.md, src/config/types.ts, src/config/schema.ts, src/config/schema.test.ts, src/config/types.test.ts, scripts/generate-schema.ts, .planning/phases/03-published-contract-regression-proof/03-RESEARCH.md</read_first>
  <behavior>
    - Test 1: schema/types still expose top-level `command_name_prefix.disable` and never a top-level `value` field.
    - Test 2: per-source `command_name_prefix.disable` and `command_name_prefix.value` remain available for `makefile`, `npm-scripts`, and `skill`.
    - Test 3: the generated JSON schema artifact matches the source schema after regeneration.
  </behavior>
  <action>Before touching repo code, sync `/Users/matt/code/github.com/softleader/agent-skills.wiki/GSD-Guide.md` again if it no longer reflects the current `/gsd-plan-phase` workflow requirements. Then verify `src/config/types.ts` and `src/config/schema.ts` still encode the exact published contract established in Phases 1 and 2: top-level `command_name_prefix` may contain only `disable?: boolean`; source-level `command_name_prefix` may contain `disable?: boolean` and `value?: string`; supported sources remain exactly `makefile`, `npm-scripts`, and `skill`. Strengthen `src/config/schema.test.ts` and `src/config/types.test.ts` so CONF-01 is explicitly proven by automated tests rather than inferred from older Phase 1 assertions. If any schema/type edits are required, run `bun run generate-schema` in the same task and update `opencode-command-inject.schema.json` immediately per AGENTS.md. Do not invent new config keys, delimiter options, or collision strategies.</action>
  <acceptance_criteria>
    - `src/config/types.ts` contains top-level `command_name_prefix?: { disable?: boolean }`.
    - `src/config/schema.ts` contains source-level `command_name_prefix` with both `disable` and `value`.
    - `src/config/schema.test.ts` contains an assertion rejecting top-level `command_name_prefix.value` or proving it is absent from the contract.
    - `src/config/types.test.ts` contains explicit coverage for the top-level and source-level prefix fields.
    - `opencode-command-inject.schema.json` contains `command_name_prefix` under both the root object and source objects.
  </acceptance_criteria>
  <verify>
    <automated>bunx vitest run src/config/schema.test.ts src/config/types.test.ts && bun run generate-schema</automated>
  </verify>
  <done>The published JSON schema and its source definitions expose the exact prefix contract users are meant to rely on, with generated artifact sync preserved.</done>
</task>

<task type="auto">
  <name>Task 2: Rewrite user-facing docs around real prefix precedence and fallback behavior</name>
  <files>README.md, docs/configuration.md</files>
  <read_first>/Users/matt/code/github.com/softleader/agent-skills.wiki/GSD-Guide.md, README.md, docs/configuration.md, .planning/phases/03-published-contract-regression-proof/03-RESEARCH.md, .planning/phases/01-prefix-controls-safe-defaults/01-prefix-controls-safe-defaults-02-SUMMARY.md, .planning/phases/02-collision-safe-naming/02-collision-safe-naming-02-SUMMARY.md</read_first>
  <action>Update `README.md` so CONF-02 is satisfied with a concise, practical introduction to naming controls: state that default generated names are unchanged unless configured; add one quick example showing top-level `command_name_prefix.disable: true`; add one example showing per-source force-on/custom prefix use under `sources.<source>.command_name_prefix`; and mention that customization-caused collisions fall back to canonical source-prefixed names with warnings. Rewrite `docs/configuration.md` so it becomes the authoritative contract for CONF-03: fix malformed JSON examples, remove stale `enabled` keys, document the exact config structure, list prefix precedence in concrete numbered rules, include example command outputs for default/global-disable/source-override/custom-prefix cases, and add a collision fallback section that explicitly names `[command-sources]` for dynamic-source warnings and `[command-inject]` for existing/config-command collisions. Keep the docs limited to shipped v1 behavior only.</action>
  <acceptance_criteria>
    - `README.md` contains `command_name_prefix` and describes unchanged defaults.
    - `README.md` contains at least one top-level disable example and one per-source override/custom prefix example.
    - `docs/configuration.md` contains the exact keys `command_name_prefix`, `disable`, and `value`.
    - `docs/configuration.md` contains a precedence section with ordered rules for top-level and per-source settings.
    - `docs/configuration.md` contains `collision fallback`, `[command-sources]`, and `[command-inject]`.
    - `docs/configuration.md` no longer contains stale `enabled` keys in the final examples.
  </acceptance_criteria>
  <verify>
    <automated>bunx vitest run src/config/schema.test.ts src/config/types.test.ts src/command-sources/command-name-prefix.test.ts src/command-sources/aggregator.test.ts src/plugin/command-inject.test.ts</automated>
  </verify>
  <done>Users can learn the final naming contract from README and the configuration reference without reading source code or reverse-engineering old examples.</done>
</task>

</tasks>

<verification>
Run `bunx vitest run src/config/schema.test.ts src/config/types.test.ts src/command-sources/command-name-prefix.test.ts src/command-sources/aggregator.test.ts src/plugin/command-inject.test.ts`, then confirm `README.md` and `docs/configuration.md` describe the same field names and fallback behavior as the schema. Before writing the summary, sync `/Users/matt/code/github.com/softleader/agent-skills.wiki/GSD-Guide.md` again per AGENTS.md.
</verification>

<success_criteria>
- The published schema artifact and source schema expose the same naming-config contract.
- README teaches the common setup paths without drifting from runtime truth.
- `docs/configuration.md` becomes the authoritative explanation of precedence, examples, and fallback behavior.
- Any schema/type edits regenerate `opencode-command-inject.schema.json` in the same plan.
</success_criteria>

<output>
After completion, create `.planning/phases/03-published-contract-regression-proof/03-published-contract-regression-proof-01-SUMMARY.md`
</output>
