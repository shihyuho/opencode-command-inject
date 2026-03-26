# Phase 1 Research: Prefix Controls & Safe Defaults

**Researched:** 2026-03-26
**Phase:** 01-prefix-controls-safe-defaults
**Question:** What do we need to know to plan this phase well?

## Recommendation

Implement Phase 1 as a small runtime contract extension in three slices:

1. **Config contract + merge semantics** — extend top-level and per-source config to express global enable/disable plus source override/value while preserving current deep-merge behavior.
2. **Name derivation in command sources** — centralize or consistently apply effective prefix rules inside makefile, npm-scripts, and skill sources without changing Phase 2 collision behavior.
3. **Regression proof** — add loader/source/plugin tests that lock default compatibility and the new naming permutations.

This phase does **not** need new architecture, new dependencies, or aggregator/plugin collision changes.

## Locked Decisions To Preserve

- Top-level `command_name_prefix` is enable/disable only (**D-01**).
- Source-level config supports inherit / force-on / force-off plus optional custom `value` (**D-02**, **D-10**).
- User/project config still deep-merges field-by-field for `sources.<source>` (**D-03**).
- `value` alone does not activate prefixing when global prefixing is off; ignore silently (**D-04**, **D-05**).
- Force-enabled source without custom `value` uses canonical prefix (**D-06**).
- Defaults remain unchanged with no new config (**D-12**).
- Collision fallback and warning contract stay deferred to Phase 2 (**D-13**).

## Existing Implementation Facts

### Config surface

- `src/config/types.ts` and `src/config/schema.ts` currently expose only `disable`, `prompt`, and `prompt_append` inside each source config.
- `src/config/loader.ts` already deep-merges nested `sources` objects and should keep that behavior.
- `scripts/generate-schema.ts` and `opencode-command-inject.schema.json` must be regenerated if schema/types change.

### Command naming today

- `src/command-sources/makefile-source.ts` emits `make:<target>`.
- `src/command-sources/npm-scripts-source.ts` emits `<runner>:<script>`.
- `src/command-sources/skill-source.ts` emits `skill:<normalized-name>`; nested namespaces already survive after the outer `skill:` prefix is removed because normalization preserves the remainder.

### Collision behavior today

- `src/command-sources/aggregator.ts` drops duplicate generated names with warning + keep-first.
- `src/plugin/command-inject.ts` also preserves existing/config-defined commands and warns instead of overwriting.
- Because Phase 1 must not change collision handling, plans should avoid touching those behaviors except where tests need to document current boundaries.

## Best Implementation Shape

### 1. Extend config with explicit prefix controls

Likely runtime shape:

```ts
interface CommandNamePrefixConfig {
  disable?: boolean
  value?: string
}

interface SourceConfig {
  disable?: boolean
  prompt?: string
  prompt_append?: string
  command_name_prefix?: CommandNamePrefixConfig
}

interface CommandInjectConfig {
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

Notes:

- Keep top-level config narrow: only `disable?: boolean`.
- Keep source-level `command_name_prefix.value` optional and local to each source.
- Prefer optional objects over enum-like strings so loader deep-merge continues working naturally.

### 2. Derive “effective prefix mode” before emitting names

The phase needs one deterministic rule set used by all three sources:

- **Default / inherit with global enabled** → canonical prefix.
- **Global disabled + source inherit** → raw name.
- **Source force-off** → raw name.
- **Source force-on + no value** → canonical prefix.
- **Source force-on + value** → `value:name`.
- **Global disabled + source value only** → raw name, no warning.

To reduce drift, planning should either:

- create a small shared helper in `src/command-sources/` that takes canonical prefix + raw name + merged source/global config and returns the final command name, or
- require all three source files to use the same decision table with tests proving parity.

Shared helper is preferable because Phase 1 spans three source adapters with identical policy but different canonical prefixes.

### 3. Keep source-specific canonical prefix knowledge where it already lives

- Makefile canonical prefix remains `make`.
- npm-scripts canonical prefix remains the detected runner (`npm`, `pnpm`, or `bun`) per **D-09**.
- skill canonical prefix remains `skill`.

This means any helper should accept `canonicalPrefix` as an input rather than trying to infer it globally.

## Files Most Likely To Change

- `src/config/types.ts`
- `src/config/schema.ts`
- `src/config/loader.test.ts`
- `src/command-sources/types.ts` (if shared prefix config types are re-exported here)
- `src/command-sources/makefile-source.ts`
- `src/command-sources/npm-scripts-source.ts`
- `src/command-sources/skill-source.ts`
- `src/command-sources/*.test.ts` for the three sources
- `src/plugin/command-inject.test.ts`
- `scripts/generate-schema.ts` indirectly via `bun run generate-schema`
- `opencode-command-inject.schema.json`

Potential helper files if introduced:

- `src/command-sources/command-name-prefix.ts`
- `src/command-sources/command-name-prefix.test.ts`

## Test Strategy Needed For Planning

### Loader/schema tests

Add/extend tests to prove:

- top-level `command_name_prefix.disable` parses successfully
- source-level `command_name_prefix.disable` and `.value` parse successfully
- user/project configs deep-merge nested `command_name_prefix` fields per source

### Source-level tests

Each source should prove at least:

- default output unchanged
- inherited global disable removes prefix
- source force-on restores canonical prefix when global disabled
- custom `value` emits `value:name`
- value-only while global disabled leaves source unprefixed

For skills specifically:

- unprefixed nested skill names keep internal namespace (e.g. `review:security`)

For npm-scripts specifically:

- force-on without value uses detected runner prefix, not `npm-scripts:`

### Plugin/integration tests

At least one plugin-level test should confirm mixed-source behavior in a temp directory, covering:

- no config → existing names unchanged
- one source overridden while others inherit

## Risks / Pitfalls

1. **Shape drift between types and schema**
   - If types and Zod schema diverge, config compiles but runtime validation rejects it.
   - Mitigation: same plan should update both files and run `bun run generate-schema`.

2. **Accidental Phase 2 leakage**
   - Raw names may collide once prefixes are disabled.
   - Mitigation: do not add fallback/warning behavior in Phase 1 plans; keep acceptance criteria focused on Phase 1 outputs and compatibility.

3. **Deep-merge edge cases**
   - Nested `command_name_prefix` objects could be overwritten incorrectly if planning treats them as replace-only.
   - Mitigation: add explicit loader tests for user/project merge cases.

4. **Inconsistent policy across sources**
   - Easy to implement slightly different rules in three source files.
   - Mitigation: central helper or mirrored matrix tests for all sources.

## Planning Guidance

- Use **two execution plans** max for Phase 1:
  1. config contract + naming helper + source-unit coverage
  2. plugin integration + schema generation verification
- Put all command-source naming behavior in the first plan because the three source files share the same policy and likely the same helper.
- Keep Phase 2 collision files out of `files_modified` unless a test must explicitly guard the boundary.

## Verification Commands Likely Useful

- `bunx vitest run src/config/loader.test.ts src/command-sources/makefile-source.test.ts src/command-sources/npm-scripts-source.test.ts src/command-sources/skill-source.test.ts src/plugin/command-inject.test.ts`
- `bun run generate-schema`
- `bun run test`

## Bottom Line

Phase 1 is a **brownfield config-and-naming change**, not an architecture change. The best plan is to extend config shape carefully, implement one shared effective-prefix decision path across the three sources, and lock behavior with focused Vitest coverage while explicitly leaving collision fallback work for Phase 2.
