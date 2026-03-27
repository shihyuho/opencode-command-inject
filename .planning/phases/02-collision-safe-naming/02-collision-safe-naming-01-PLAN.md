---
phase: 02-collision-safe-naming
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/command-sources/command-name-prefix.ts
  - src/command-sources/command-name-prefix.test.ts
  - src/command-sources/types.ts
  - src/command-sources/aggregator.ts
  - src/command-sources/aggregator.test.ts
autonomous: true
requirements: [SAFE-02, SAFE-03, SAFE-04]
must_haves:
  truths:
    - "Dynamic-source commands stay accessible when customized names collide."
    - "A collision group introduced by prefix customization falls back together to canonical source-prefixed names."
    - "A pre-existing canonical collision still uses deterministic keep-first behavior instead of a new rename scheme."
  artifacts:
    - path: "src/command-sources/command-name-prefix.ts"
      provides: "Configured-vs-canonical command naming metadata for dynamic commands"
      contains: "canonicalName"
    - path: "src/command-sources/types.ts"
      provides: "Command metadata needed for collision classification"
      contains: "sourceId"
    - path: "src/command-sources/aggregator.ts"
      provides: "Dynamic-source collision-group fallback resolution"
      exports: ["aggregateCommandSources"]
    - path: "src/command-sources/aggregator.test.ts"
      provides: "Regression proof for source-layer fallback and warning behavior"
      contains: "canonical fallback"
  key_links:
    - from: "src/command-sources/command-name-prefix.ts"
      to: "src/command-sources/aggregator.ts"
      via: "metadata consumed for collision-group decisions"
      pattern: "canonicalName|usedCustomizedName"
    - from: "src/command-sources/aggregator.ts"
      to: "src/command-sources/aggregator.test.ts"
      via: "warning and fallback assertions"
      pattern: "attempted canonical fallback|keeping first"
---

<objective>
Create the collision metadata and source-layer fallback behavior needed to keep dynamic commands reachable when Phase 1 naming customization creates duplicate names.

Purpose: Establish the shared runtime contract for detecting customization-caused collisions per D-01 through D-11 before plugin-level injection logic builds on it.
Output: Tested command metadata plus source-layer collision-group fallback and warning handling.
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
@.planning/phases/01-prefix-controls-safe-defaults/01-prefix-controls-safe-defaults-01-SUMMARY.md
@.planning/phases/01-prefix-controls-safe-defaults/01-prefix-controls-safe-defaults-02-SUMMARY.md

<interfaces>
From src/command-sources/types.ts:
```typescript
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

From src/command-sources/command-name-prefix.ts:
```typescript
export interface BuildCommandNameOptions {
  name: string
  canonicalPrefix: string
  globalCommandNamePrefix?: CommandInjectConfig["command_name_prefix"]
  sourceConfig?: SourceConfig
}

export function buildCommandName(options: BuildCommandNameOptions): string
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
  <name>Task 1: Extend command metadata for canonical-vs-configured collision detection</name>
  <files>src/command-sources/command-name-prefix.ts, src/command-sources/command-name-prefix.test.ts, src/command-sources/types.ts</files>
  <read_first>src/command-sources/command-name-prefix.ts, src/command-sources/command-name-prefix.test.ts, src/command-sources/types.ts, .planning/phases/02-collision-safe-naming/02-CONTEXT.md, .planning/phases/01-prefix-controls-safe-defaults/01-prefix-controls-safe-defaults-01-SUMMARY.md</read_first>
  <behavior>
    - Test 1: default canonical naming exposes both configured and canonical names as the same `make:build` style value.
    - Test 2: global disable or source custom value exposes `configuredName` different from `canonicalName` and marks the command as customized.
    - Test 3: raw command outputs like `build` or `review:security` still retain canonical fallback names like `make:build` or `skill:review:security`.
  </behavior>
  <action>Per D-02, D-03, and D-10, replace the string-only naming result with a richer exported metadata shape in `src/command-sources/command-name-prefix.ts` that includes the final configured command name, the canonical `canonicalPrefix:name` fallback name, and a boolean that tells downstream code whether customization changed the emitted name. Preserve all existing Phase 1 precedence exactly: source force-off returns raw name, source force-on uses `value ?? canonicalPrefix`, global disable keeps raw name unless source force-on re-enables, and source `value` without force-on while global disable remains raw and not activated. Update `src/command-sources/command-name-prefix.test.ts` to assert those exact metadata fields instead of only the final string. Extend `src/command-sources/types.ts` so dynamic commands can carry `sourceId`, `canonicalName`, and `usedCustomizedName` without weakening existing `CommandSource` typing.</action>
  <acceptance_criteria>
    - `src/command-sources/command-name-prefix.ts` exports metadata containing `configuredName`, `canonicalName`, and `usedCustomizedName`.
    - `src/command-sources/types.ts` contains `sourceId` and `canonicalName` on the command shape used by aggregators.
    - `src/command-sources/command-name-prefix.test.ts` contains at least one assertion for a raw configured name with a different canonical fallback name.
  </acceptance_criteria>
  <verify>
    <automated>bunx vitest run src/command-sources/command-name-prefix.test.ts</automated>
  </verify>
  <done>Dynamic commands can report both their user-requested name and their canonical fallback name without changing Phase 1 naming behavior.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Resolve dynamic-source collision groups with canonical fallback and summary warnings</name>
  <files>src/command-sources/aggregator.ts, src/command-sources/aggregator.test.ts, src/command-sources/types.ts</files>
  <read_first>src/command-sources/aggregator.ts, src/command-sources/aggregator.test.ts, src/command-sources/types.ts, src/command-sources/command-name-prefix.ts, .planning/phases/02-collision-safe-naming/02-CONTEXT.md, .planning/phases/02-collision-safe-naming/02-RESEARCH.md</read_first>
  <behavior>
    - Test 1: two dynamic commands that both become `build` because prefixes were removed fall back together to `make:build` and `pnpm:build`.
    - Test 2: only the actual collision group falls back; unrelated customized commands keep their configured names.
    - Test 3: if canonical fallback still collides, aggregator keeps first and warns that canonical fallback was attempted before keep-first won.
  </behavior>
  <action>Update `src/command-sources/aggregator.ts` per D-01, D-04, D-05, D-07, D-08, D-09, D-10, and D-11 so it groups dynamic commands by their configured `name`, detects whether each collision is newly introduced by prefix customization using `usedCustomizedName` plus canonical-name comparison, and only then renames the entire collision group to each command's own canonical fallback name. Keep the warning prefix exactly `[command-sources]`. Emit one warning per collision group that includes the collided configured name, participating source IDs, and the final fallback names. If canonical fallback still collides, keep the current deterministic keep-first result and emit wording that canonical fallback was attempted and the final behavior remained keep-first. Leave pre-existing canonical collisions on the old keep-first path instead of treating them as Phase 2 fallback work.</action>
  <acceptance_criteria>
    - `src/command-sources/aggregator.ts` contains one collision-group warning path using the `[command-sources]` prefix.
    - `src/command-sources/aggregator.test.ts` proves both successful canonical fallback and unresolved attempted-fallback keep-first behavior.
    - `src/command-sources/aggregator.test.ts` includes an assertion that unrelated command names remain unchanged when another group falls back.
  </acceptance_criteria>
  <verify>
    <automated>bunx vitest run src/command-sources/aggregator.test.ts src/command-sources/command-name-prefix.test.ts</automated>
  </verify>
  <done>Dynamic-source collisions caused by customized naming fall back per collision group to canonical names, while unresolved canonical collisions still use deterministic keep-first behavior with explicit warning text.</done>
</task>

</tasks>

<verification>
- Run `bunx vitest run src/command-sources/aggregator.test.ts src/command-sources/command-name-prefix.test.ts`
- Confirm source-layer warnings keep the `[command-sources]` prefix and include canonical fallback details
</verification>

<success_criteria>
- Source adapters and aggregator can distinguish configured vs canonical names.
- Dynamic-source collisions introduced by prefix customization keep all affected commands reachable.
- Existing keep-first behavior remains intact for collisions that are not Phase 2 fallback cases.
</success_criteria>

<output>
After completion, create `.planning/phases/02-collision-safe-naming/02-collision-safe-naming-01-SUMMARY.md`
</output>
