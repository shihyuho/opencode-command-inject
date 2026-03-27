---
phase: 02-collision-safe-naming
plan: 02
type: execute
wave: 2
depends_on: [02-collision-safe-naming-01]
files_modified:
  - src/plugin/command-inject.ts
  - src/plugin/command-inject.test.ts
autonomous: true
requirements: [SAFE-02, SAFE-03, SAFE-04]
must_haves:
  truths:
    - "Generated commands remain accessible when customized names collide with existing commands or config-defined commands."
    - "Plugin-layer collisions fall back to canonical source-prefixed names instead of overwriting existing commands."
    - "Users receive one plugin-layer warning per collision group that explains the fallback result."
  artifacts:
    - path: "src/plugin/command-inject.ts"
      provides: "Plugin-layer canonical fallback handling against existing/config commands"
      exports: ["createCommandInjectHooks"]
    - path: "src/plugin/command-inject.test.ts"
      provides: "Integration proof for fallback without overwriting existing/config commands"
      contains: "customized command name collision"
  key_links:
    - from: "src/plugin/command-inject.ts"
      to: "src/command-sources/aggregator.ts"
      via: "dynamic command metadata and source-layer fallback output"
      pattern: "canonicalName|sourceId"
    - from: "src/plugin/command-inject.ts"
      to: "config.command"
      via: "skip injection when canonical fallback still conflicts with existing/config commands"
      pattern: "already exists in config|keeping existing"
---

<objective>
Apply collision-safe naming at the plugin injection boundary so dynamic commands stay reachable without overwriting existing or config-defined commands.

Purpose: Finish the Phase 2 runtime contract at the final duplicate gate, preserving existing/config command precedence while surfacing clear fallback warnings.
Output: Plugin-layer fallback resolution and integration tests that prove source metadata is wired through real injection behavior.
</objective>

<execution_context>
@$HOME/.config/opencode/get-shit-done/workflows/execute-plan.md
@$HOME/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/02-collision-safe-naming/02-CONTEXT.md
@.planning/phases/02-collision-safe-naming/02-RESEARCH.md
@.planning/phases/02-collision-safe-naming/02-VALIDATION.md
@.planning/phases/02-collision-safe-naming/02-collision-safe-naming-01-PLAN.md
@.planning/phases/01-prefix-controls-safe-defaults/01-prefix-controls-safe-defaults-02-SUMMARY.md

<interfaces>
From src/plugin/command-inject.ts:
```typescript
export interface CommandInjectOptions {
  projectRoot: string
  logger: Logger
  existingCommands: CommandInfo[]
  loadedSkills?: LoadedSkillCommandInput[]
  config?: CommandInjectConfig
}

export async function createCommandInjectHooks(
  options: CommandInjectOptions
): Promise<Partial<Hooks>>
```

From src/command-sources/aggregator.ts:
```typescript
export async function aggregateCommandSources(
  sources: readonly CommandSource[],
  context: LoadContext
): Promise<CommandInfo[]>
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add plugin-layer canonical fallback against existing and config-defined commands</name>
  <files>src/plugin/command-inject.ts</files>
  <read_first>src/plugin/command-inject.ts, src/command-sources/aggregator.ts, src/command-sources/types.ts, .planning/phases/02-collision-safe-naming/02-CONTEXT.md, .planning/phases/02-collision-safe-naming/02-collision-safe-naming-01-PLAN.md, .planning/phases/01-prefix-controls-safe-defaults/01-prefix-controls-safe-defaults-02-SUMMARY.md</read_first>
  <behavior>
    - Test 1: a dynamic command renamed to `build` by prefix removal does not disappear when `build` already exists; it falls back to its canonical source-prefixed name.
    - Test 2: existing/config-defined commands still win if the dynamic command's canonical fallback also collides.
    - Test 3: plugin-layer fallback emits exactly one `[command-inject]` warning per collision group with final names.
  </behavior>
  <action>Update `src/plugin/command-inject.ts` per D-01, D-04, D-07, D-08, D-09, D-10, and D-11 so the dynamic-vs-existing merge step no longer does immediate name-based keep-existing only. Instead, use the metadata from Plan 01 to classify collisions against `existingCommands` and config-defined commands, attempt canonical fallback for only the dynamic commands in the actual collision group, and then merge without overwriting existing or config-owned commands. Keep warning prefix ownership exactly `[command-inject]`. If canonical fallback still collides with existing/config commands, preserve current precedence and warn that canonical fallback was attempted before final keep-existing / keep-first behavior. Do not change `config.command[cmd.name]` overwrite protection inside the hook; Phase 2 should only improve how dynamic names are chosen before injection.</action>
  <acceptance_criteria>
    - `src/plugin/command-inject.ts` contains a plugin-layer fallback path using `[command-inject]` warnings.
    - `src/plugin/command-inject.ts` still contains the existing config overwrite guard before assignment to `config.command[cmd.name]`.
    - The merge logic distinguishes configured-name collisions from canonical-fallback collisions.
  </acceptance_criteria>
  <verify>
    <automated>bunx vitest run src/plugin/command-inject.test.ts</automated>
  </verify>
  <done>Dynamic-vs-existing collisions caused by customized naming resolve to canonical names when possible and otherwise preserve existing/config command precedence without silent loss.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Prove plugin-layer fallback, warnings, and no-overwrite guarantees with integration tests</name>
  <files>src/plugin/command-inject.test.ts</files>
  <read_first>src/plugin/command-inject.test.ts, src/plugin/command-inject.ts, src/command-sources/aggregator.test.ts, .planning/phases/02-collision-safe-naming/02-RESEARCH.md, .planning/phases/02-collision-safe-naming/02-VALIDATION.md</read_first>
  <behavior>
    - Test 1: disabling prefixes can make a dynamic source collide with an existing command, and the injected command still appears under its canonical fallback name.
    - Test 2: only the collision group falls back in a mixed-source integration case while unrelated customized commands keep configured names.
    - Test 3: canonical fallback failure keeps existing/config precedence and warns that fallback was attempted.
  </behavior>
  <action>Add integration coverage in `src/plugin/command-inject.test.ts` that exercises real temp-dir startup through `createCommandInjectHooks`. Include one case where a raw configured name collides with an existing command and falls back to `make:build` or `pnpm:test`, one case where a config-defined command still blocks injection even after attempted canonical fallback, and one mixed-source case proving unrelated commands remain customized while only the actual collision group falls back. Assert warning substrings for the collided configured name, `[command-inject]` prefix, participating source IDs or existing-command mention, final fallback names, and attempted-fallback wording when canonical names are still not unique.</action>
  <acceptance_criteria>
    - `src/plugin/command-inject.test.ts` includes coverage for successful plugin-layer canonical fallback.
    - `src/plugin/command-inject.test.ts` includes coverage for unresolved attempted canonical fallback with existing/config precedence preserved.
    - `src/plugin/command-inject.test.ts` asserts `[command-inject]` warning content and final fallback names.
  </acceptance_criteria>
  <verify>
    <automated>bunx vitest run src/plugin/command-inject.test.ts src/command-sources/aggregator.test.ts && bun run test</automated>
  </verify>
  <done>Integration coverage proves Phase 2 fallback keeps generated commands reachable without overwriting existing/config-defined commands and surfaces the required warning details.</done>
</task>

</tasks>

<verification>
- Run `bunx vitest run src/plugin/command-inject.test.ts src/command-sources/aggregator.test.ts`
- Run `bun run test`
- Confirm plugin-layer warnings use `[command-inject]` and existing/config commands remain untouched
</verification>

<success_criteria>
- Dynamic commands no longer disappear when customized names collide with existing/config commands.
- Canonical fallback works end-to-end through `createCommandInjectHooks`.
- Plugin-layer warnings explain the collided configured name, the participants, and the final fallback or attempted-fallback outcome.
</success_criteria>

<output>
After completion, create `.planning/phases/02-collision-safe-naming/02-collision-safe-naming-02-SUMMARY.md`
</output>
