# Technology Stack

**Project:** opencode-command-inject command-name prefix configurability
**Researched:** 2026-03-26

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| TypeScript | `^5.7.3` (existing) | Feature implementation and types | Reuse the repo's strict TypeScript baseline; this feature is mostly config modeling and deterministic naming logic, not something that benefits from new language/runtime tooling. **Confidence: HIGH** |
| `@opencode-ai/plugin` | `^1.2.15` (existing) | OpenCode hook integration | No plugin-API change is needed. Prefix configurability should remain an internal naming concern before command injection, not a host-plugin concern. **Confidence: HIGH** |
| `zod` | `^3.25.0` (existing) | Runtime config validation and inferred config types | The repo already validates config with Zod and derives TS types from that schema boundary. Extending the existing schema is the lowest-risk path. **Confidence: HIGH** |

### Database
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| None | — | Persistent storage | This plugin is startup-time filesystem discovery only. Prefix configuration belongs in existing JSON/JSONC config, not a new persistence layer. **Confidence: HIGH** |

### Infrastructure
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| JSON / JSONC config files | existing | User + project configuration surface | The loader already supports `.jsonc` and deep-merges user/project config. Add prefix controls into the existing config tree so they inherit current precedence rules automatically. **Confidence: HIGH** |
| Generated JSON Schema | existing artifact | Editor autocomplete and validation | Prefix settings should be added to the Zod schema first, then regenerated into `opencode-command-inject.schema.json` so docs, runtime validation, and editor UX stay aligned. **Confidence: HIGH** |

### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod-to-json-schema` | `3.24.1` (existing) | Generate `opencode-command-inject.schema.json` from the Zod schema | Keep it for this milestone because the repo is still on Zod 3. Use it only as the current schema generation bridge. Do **not** expand its role beyond generation. **Confidence: MEDIUM-HIGH** |
| Vitest | `^3.2.4` (existing) | Schema, merge, and collision-fallback tests | Add focused tests for config parsing, deep-merge behavior, name planning, and collision fallback. This feature is heavily testable without end-to-end tooling. **Confidence: HIGH** |
| Internal naming module (new repo code, not dependency) | n/a | Centralized command-name planning | Add a small internal module such as `src/command-sources/naming.ts` or `src/config/command-name-prefix.ts` to compute final names. This is better than scattering string concatenation across source adapters. **Confidence: HIGH** |

## Recommended Implementation Shape

### 1. Keep the existing validation stack; do not migrate to Zod 4 in this milestone

Use the current stack:

- `src/config/schema.ts` remains the single validation source of truth
- `src/config/types.ts` stays aligned with the schema
- `scripts/generate-schema.ts` continues generating `opencode-command-inject.schema.json`

Why:

- The feature is additive and local.
- Zod 4 now has native `z.toJSONSchema()`, but adopting it would turn a naming feature into a validation-stack migration.
- `zod-to-json-schema`'s own README says the project stopped receiving updates in November 2025 because Zod 4 supersedes it. That makes migration a good **future cleanup**, not a good dependency to drag into this milestone.

**Recommendation:** implement prefix configurability on the current Zod 3 stack, and optionally create a separate future milestone for `zod` v4 + native JSON Schema migration.

### 2. Use config shapes that match the repo's current `top-level + sources.<source>` pattern

Recommended config model:

```jsonc
{
  "command_name_prefix": true,
  "sources": {
    "makefile": {
      "command_name_prefix": {
        "enabled": true,
        "value": "make"
      }
    },
    "npm-scripts": {
      "command_name_prefix": {
        "enabled": true,
        "value": "pnpm"
      }
    },
    "skill": {
      "command_name_prefix": {
        "enabled": false
      }
    }
  }
}
```

Prescriptive rules:

- Top-level `command_name_prefix?: boolean`
  - `true`/unset = keep today's behavior
  - `false` = globally disable prefixes unless a source opts back in
- Source-level `command_name_prefix?: { enabled?: boolean; value?: string }`
  - `enabled` overrides the global boolean for that source
  - `value` customizes the literal prefix text for that source

Why this shape is best:

- It preserves the repo's existing config ownership model: global defaults at top level, source-specific behavior under `sources.<source>`.
- It works well with the existing deep merge in `src/config/loader.ts`; object fields can layer cleanly across user and project config.
- It avoids brittle unions like `boolean | string | object`, which are valid but create worse merge semantics and weaker editor UX in generated JSON Schema.

### 3. Centralize naming in a two-stage runtime planner

Do **not** keep name construction inside each source adapter as raw string interpolation.

Recommended runtime flow:

1. Each source adapter emits a stable logical name payload, e.g.
   - source id
   - source default prefix (`make`, detected runner, `skill`)
   - unprefixed base name (`build`, `dev`, `review`)
2. A single naming planner resolves config and computes:
   - preferred final name
   - fallback prefixed name
3. Aggregation performs collision handling against the preferred names.
4. When preferred names collide because prefixes were removed or customized, the colliding commands fall back to source-prefixed names automatically.
5. Only after names are finalized should `createCommandInjectHooks()` merge against existing commands.

Why this is best:

- The new requirement is not just “rename strings”; it is a deterministic conflict-resolution policy.
- Current `aggregateCommandSources()` only knows final `command.name` strings and uses keep-first behavior. That is insufficient for “fallback to prefix on collision”.
- A centralized planner makes the rules testable and keeps source adapters focused on discovery, not policy.

### 4. Treat collision fallback as naming resolution, not duplicate dropping

Recommended behavior:

- If a command's preferred name is unique, use it.
- If two or more dynamic commands resolve to the same preferred name, retry those colliding commands with their source-prefixed fallback names.
- If fallback names still collide, then warn and keep-first as the final safety net.
- Existing user/static commands should still win last, exactly as they do today in `createCommandInjectHooks()`.

Why:

- This preserves the feature promise: removing/customizing prefixes should not silently hide commands.
- It minimizes behavior change: only collision groups get rewritten.
- It composes with the current injection conflict rule instead of replacing it.

### 5. Validate prefix values narrowly

Recommended schema constraints:

- `value` should be a non-empty string after trim.
- Reject values containing `:` so the final format stays `prefix:name` rather than `a:b:name`.
- Keep formatting ownership in code: the config stores the prefix token only, and rendering adds `:${baseName}`.

Why:

- The milestone explicitly keeps the naming format fixed.
- Schema-level validation prevents ambiguous command names from ever reaching runtime.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Validation/schema stack | Stay on Zod 3 + `zod-to-json-schema` for this milestone | Migrate immediately to Zod 4 + native `z.toJSONSchema()` | Good long-term direction, bad milestone scope. It adds unrelated migration risk to a config/naming feature. |
| Global config design | Top-level `command_name_prefix: boolean` only | Global custom prefix strings | Violates the chosen ownership model and makes source identity harder to reason about. |
| Source config design | `sources.<source>.command_name_prefix = { enabled?, value? }` | `boolean | string` union | Union is terser but merges poorly across user/project config and produces weaker schema/editor UX. |
| Runtime naming | Central naming planner with preferred + fallback names | Keep per-source string concatenation and rely on current aggregator warnings | Cannot implement automatic fallback cleanly because the aggregator only sees already-finalized names. |
| Collision policy | Fallback to source-prefixed names, then warn/keep-first only if still conflicting | Current keep-first duplicate dropping | Fails the new requirement because prefix removal/customization would hide commands. |
| New dependencies | No new package dependency | Add config helper / schema helper libraries | Unnecessary. Existing stack already covers validation, typing, tests, and schema generation. |

## Installation

```bash
# Core
# No new dependencies recommended for this milestone.

# Dev dependencies
# Keep existing zod-to-json-schema until a separate Zod 4 migration milestone.
```

## What Not to Introduce

- **Do not introduce a new top-level `naming` namespace.** It fights the repo's existing config layout and makes source-specific overrides less obvious.
- **Do not introduce a new dependency just for deep merge or config parsing.** The repo already has working loader behavior.
- **Do not encode delimiters in config values.** Keep `value` as the prefix token only; code should always render `prefix:name`.
- **Do not make collision fallback depend on source load order alone.** Resolve collisions deliberately, then fall back to current warning-based keep-first only as a final guard.
- **Do not couple this milestone to Zod 4 migration.** The official direction is clear, but it is a separate change set.

## Sources

- Repo source: `src/config/types.ts`, `src/config/schema.ts`, `src/config/loader.ts`, `src/command-sources/makefile-source.ts`, `src/command-sources/npm-scripts-source.ts`, `src/command-sources/skill-source.ts`, `src/command-sources/aggregator.ts`, `src/plugin/command-inject.ts`, `scripts/generate-schema.ts`, `package.json` — **HIGH**
- Zod 4 official docs: https://zod.dev/json-schema — native `z.toJSONSchema()` and schema-target options — **HIGH**
- Context7 `/colinhacks/zod/v4.0.1` — confirms built-in JSON Schema generation in Zod 4 — **HIGH**
- Context7 `/colinhacks/zod/v3.24.2` — confirms optional object fields and input/output typing behavior in Zod 3 — **HIGH**
- `zod-to-json-schema` README: https://github.com/StefanTerdell/zod-to-json-schema/blob/master/README.md — states project deprecation as of Nov 2025 and documents current draft-07 generation behavior — **HIGH**
