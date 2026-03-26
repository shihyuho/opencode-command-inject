---
phase: 01-prefix-controls-safe-defaults
plan: 02
type: execute
wave: 2
depends_on:
  - 01-prefix-controls-safe-defaults-01
files_modified:
  - src/command-sources/makefile-source.ts
  - src/command-sources/npm-scripts-source.ts
  - src/command-sources/skill-source.ts
  - src/command-sources/makefile-source.test.ts
  - src/command-sources/npm-scripts-source.test.ts
  - src/command-sources/skill-source.test.ts
  - src/plugin/command-inject.test.ts
  - opencode-command-inject.schema.json
autonomous: true
requirements:
  - PFX-02
  - PFX-03
  - PFX-04
  - SAFE-01
must_haves:
  truths:
    - "A user with no new config still gets the current canonical command names for every source."
    - "A user can disable prefixes globally and see raw names unless a source explicitly forces prefixes back on."
    - "A user can apply a source-local custom prefix and get `prefix:name` output for makefile, npm-scripts, and skill commands."
  artifacts:
    - path: "src/command-sources/makefile-source.ts"
      provides: "Makefile naming follows effective prefix rules"
      contains: "buildCommandName"
    - path: "src/command-sources/npm-scripts-source.ts"
      provides: "Runner-based npm script naming follows effective prefix rules"
      contains: "buildCommandName"
    - path: "src/command-sources/skill-source.ts"
      provides: "Skill naming follows effective prefix rules while preserving nested namespaces"
      contains: "buildCommandName"
    - path: "opencode-command-inject.schema.json"
      provides: "Published schema includes the new prefix fields"
      contains: "command_name_prefix"
  key_links:
    - from: "src/command-sources/makefile-source.ts"
      to: "src/command-sources/command-name-prefix.ts"
      via: "shared helper call"
      pattern: "buildCommandName"
    - from: "src/command-sources/npm-scripts-source.ts"
      to: "detectNpmScriptsRunner"
      via: "runner stays canonical prefix when force-enabled"
      pattern: "detectNpmScriptsRunner"
    - from: "src/plugin/command-inject.test.ts"
      to: "all three source adapters"
      via: "integration assertions on emitted command names"
      pattern: "command_name_prefix"
---

<objective>
Wire the tested prefix rules into every command source and prove Phase 1 compatibility.

Purpose: Make the new config user-visible without changing the existing collision behavior or default names.
Output: Source adapters, integration tests, and generated schema all reflect the locked Phase 1 behavior.
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
@.planning/phases/01-prefix-controls-safe-defaults/01-prefix-controls-safe-defaults-01-SUMMARY.md
@/Users/matt/code/github.com/softleader/agent-skills.wiki/GSD-Guide.md
@src/command-sources/makefile-source.ts
@src/command-sources/npm-scripts-source.ts
@src/command-sources/skill-source.ts
@src/plugin/command-inject.test.ts
@scripts/generate-schema.ts

<interfaces>
Expected from Plan 01:
```ts
export function buildCommandName(options: {
  name: string
  canonicalPrefix: string
  globalConfig?: { disable?: boolean }
  sourceConfig?: { command_name_prefix?: { disable?: boolean; value?: string } }
}): string
```

Existing source contracts:
```ts
export interface CommandInfo {
  name: string
  description: string
  template: string
}

export interface CommandSource {
  id: string
  load(ctx: LoadContext): Promise<CommandInfo[]>
}
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Apply effective prefix rules to each source adapter</name>
  <files>src/command-sources/makefile-source.ts, src/command-sources/npm-scripts-source.ts, src/command-sources/skill-source.ts, src/command-sources/makefile-source.test.ts, src/command-sources/npm-scripts-source.test.ts, src/command-sources/skill-source.test.ts</files>
  <read_first>/Users/matt/code/github.com/softleader/agent-skills.wiki/GSD-Guide.md, src/command-sources/command-name-prefix.ts, src/command-sources/makefile-source.ts, src/command-sources/npm-scripts-source.ts, src/command-sources/skill-source.ts, src/command-sources/makefile-source.test.ts, src/command-sources/npm-scripts-source.test.ts, src/command-sources/skill-source.test.ts, src/skills/normalize-skill-name.ts, .planning/phases/01-prefix-controls-safe-defaults/01-CONTEXT.md</read_first>
  <behavior>
    - Test 1: makefile names switch between `make:target`, `target`, and `custom:target` according to D-06, D-07, and D-10.
    - Test 2: npm-scripts force-on mode uses the detected runner prefix (`npm`, `pnpm`, or `bun`) per D-09.
    - Test 3: skill names drop only the outer `skill:` prefix and keep nested namespaces per D-08.
    - Test 4: a source `value` without force-on remains ignored while global prefixes are disabled per D-04 and D-05.
  </behavior>
  <action>Before editing runtime files for this wave, sync `/Users/matt/code/github.com/softleader/agent-skills.wiki/GSD-Guide.md` if it has not already been updated in the current GSD session. Then update all three source adapters to call `buildCommandName(...)` when creating `CommandInfo.name`. In `makefile-source.ts`, pass raw `target` and canonical prefix `make`. In `npm-scripts-source.ts`, pass raw script name and canonical prefix equal to the detected runner so force-enabled behavior remains `pnpm:test`, `npm:test`, or `bun:test` per D-09. In `skill-source.ts`, pass the normalized skill name without the outer `skill:` prefix so unprefixed outputs still keep nested namespaces like `review:security` per D-08. Expand each source test file with exact assertions for default compatibility (D-12), global disable raw-name output (D-07), source force-on canonical fallback (D-06), custom `value:name` output (D-10), and ignored value-only behavior while global disable is true (D-04/D-05). Do not add any collision fallback logic or warnings in these files; that is deferred by D-13.</action>
  <acceptance_criteria>
    - Each source file contains `buildCommandName(`.
    - `src/command-sources/makefile-source.test.ts` asserts both `make:build` and `build` outputs.
    - `src/command-sources/npm-scripts-source.test.ts` asserts runner-based canonical output when force-enabled.
    - `src/command-sources/skill-source.test.ts` asserts nested namespace preservation after removing the outer prefix.
    - No new warning message for collision fallback appears in the source tests.
  </acceptance_criteria>
  <verify>
    <automated>bunx vitest run src/command-sources/makefile-source.test.ts src/command-sources/npm-scripts-source.test.ts src/command-sources/skill-source.test.ts</automated>
  </verify>
  <done>Every source emits names from the same Phase 1 rules while keeping current defaults for users who add no new prefix config.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Prove compatibility at plugin level and publish the schema artifact</name>
  <files>src/plugin/command-inject.test.ts, opencode-command-inject.schema.json</files>
  <read_first>src/plugin/command-inject.test.ts, src/plugin/command-inject.ts, scripts/generate-schema.ts, src/config/schema.ts, .planning/phases/01-prefix-controls-safe-defaults/01-CONTEXT.md</read_first>
  <behavior>
    - Test 1: no new config still injects existing canonical command names per SAFE-01 and D-12.
    - Test 2: mixed config can disable prefixes globally but force one source back to canonical prefix and set another source to a custom prefix.
    - Test 3: generated JSON schema includes the published `command_name_prefix` fields.
  </behavior>
  <action>Extend `src/plugin/command-inject.test.ts` with an integration-style temp-dir test that passes a `config` object containing top-level `command_name_prefix.disable`, a source-level force-on override, and a source-level custom `value`, then asserts the injected command map contains the exact expected names. Also keep or strengthen an explicit no-config test so SAFE-01 is provable from plugin-level behavior, not only source-unit tests. After code and tests pass, run `bun run generate-schema` and commit the resulting `opencode-command-inject.schema.json` update so published schema stays aligned with `src/config/schema.ts` per AGENTS.md.</action>
  <acceptance_criteria>
    - `src/plugin/command-inject.test.ts` contains a no-config compatibility assertion.
    - `src/plugin/command-inject.test.ts` contains a mixed-prefix integration case using `command_name_prefix`.
    - `opencode-command-inject.schema.json` contains `command_name_prefix`.
  </acceptance_criteria>
  <verify>
    <automated>bunx vitest run src/plugin/command-inject.test.ts && bun run generate-schema && bunx vitest run src/plugin/command-inject.test.ts</automated>
  </verify>
  <done>Phase 1 behavior is proven end-to-end and the published schema artifact matches the runtime config contract.</done>
</task>

</tasks>

<verification>
Run `bunx vitest run src/command-sources/makefile-source.test.ts src/command-sources/npm-scripts-source.test.ts src/command-sources/skill-source.test.ts src/plugin/command-inject.test.ts` and confirm `opencode-command-inject.schema.json` includes `command_name_prefix` after `bun run generate-schema`. Before writing the summary, sync `/Users/matt/code/github.com/softleader/agent-skills.wiki/GSD-Guide.md` again per AGENTS.md.
</verification>

<success_criteria>
- Default command names remain unchanged when no new config is passed.
- Global disable, source override, and custom prefix behaviors are covered across makefile, npm-scripts, and skill sources.
- Published schema is regenerated after the config contract changes.
- Local GSD wiki guidance is synced before execution starts and again before the plan summary is reported.
</success_criteria>

<output>
After completion, create `.planning/phases/01-prefix-controls-safe-defaults/01-prefix-controls-safe-defaults-02-SUMMARY.md`
</output>
