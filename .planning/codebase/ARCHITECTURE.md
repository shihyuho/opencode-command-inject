# Architecture

**Analysis Date:** 2026-03-26

## Pattern Overview

**Overall:** Functional core with source adapters behind a plugin integration layer

**Key Characteristics:**
- `index.ts` is a minimal package entry that re-exports the plugin surface from `src/plugin.ts`
- `src/plugin.ts` orchestrates startup by loading config, discovering skills, merging manual/discovered skill inputs, and delegating hook creation to `src/plugin/command-inject.ts`
- `src/command-sources/*.ts` implements one adapter per command source (`Makefile`, `package.json` scripts, discovered skills) behind the shared `CommandSource` interface in `src/command-sources/types.ts`

## Layers

**Package Entrypoint Layer:**
- Purpose: Expose the public npm/plugin API without business logic
- Location: `index.ts`
- Contains: Re-exports for `CommandInjectPlugin`, `createCommandInjectPlugin`, and `CommandInjectPluginOptions`
- Depends on: `src/plugin.ts`
- Used by: OpenCode plugin loading and package consumers

**Plugin Orchestration Layer:**
- Purpose: Convert OpenCode plugin context into configured runtime hooks
- Location: `src/plugin.ts`, `src/plugin/command-inject.ts`
- Contains: Plugin factory, source enable/disable decisions, manual/discovered skill merge logic, OpenCode hook implementations
- Depends on: `src/config/index.ts`, `src/skills/discovery.ts`, `src/skills/normalize-skill-name.ts`, `src/command-sources/index.ts`, `src/command-sources/template.ts`
- Used by: `index.ts` and OpenCode's plugin runtime

**Command Source Adapter Layer:**
- Purpose: Load commands from heterogeneous project inputs and normalize them into `CommandInfo`
- Location: `src/command-sources/`
- Contains: `MakefileCommandSource` in `src/command-sources/makefile-source.ts`, `NpmScriptsCommandSource` in `src/command-sources/npm-scripts-source.ts`, `SkillCommandSource` in `src/command-sources/skill-source.ts`, plus aggregation and template helpers
- Depends on: Node filesystem/path APIs, `src/skills/normalize-skill-name.ts`, `src/config/types.ts`
- Used by: `src/plugin/command-inject.ts`

**Configuration Layer:**
- Purpose: Load, validate, and merge user/project configuration for source behavior
- Location: `src/config/`
- Contains: Config loader in `src/config/loader.ts`, schema in `src/config/schema.ts`, types in `src/config/types.ts`, JSONC preprocessing in `src/config/strip-json-comments.ts`
- Depends on: `zod`, Node `fs`, `os`, and `path`
- Used by: `src/plugin.ts`, `scripts/generate-schema.ts`

**Skill Discovery Layer:**
- Purpose: Scan supported skill roots, parse `SKILL.md`, and convert nested directories into namespaced skill definitions
- Location: `src/skills/`
- Contains: Recursive discovery in `src/skills/discovery.ts`, frontmatter parsing in `src/skills/frontmatter.ts`, `SKILL.md` loading in `src/skills/load-skill.ts`, name normalization in `src/skills/normalize-skill-name.ts`
- Depends on: Node filesystem/path APIs and `src/command-sources/errors.ts`
- Used by: `src/plugin.ts`, `src/command-sources/skill-source.ts`

**Verification/Test Support Layer:**
- Purpose: Exercise each layer with focused Vitest coverage and temporary filesystem helpers
- Location: `src/**/*.test.ts`, `src/test-utils/temp-dir.ts`
- Contains: Source-level tests, plugin integration tests, temp directory/file helpers
- Depends on: `vitest`, Node temporary filesystem utilities
- Used by: CI in `.github/workflows/test.yml`

## Data Flow

**Plugin Startup Flow:**

1. OpenCode loads `index.ts`, which re-exports `createCommandInjectPlugin` and `CommandInjectPlugin` from `src/plugin.ts`.
2. `createCommandInjectPlugin()` in `src/plugin.ts` receives the OpenCode context and calls `loadPluginConfig(ctx.directory)` from `src/config/loader.ts`.
3. `src/plugin.ts` decides whether skill discovery is enabled, then optionally calls `discoverSkills()` from `src/skills/discovery.ts`.
4. `mergeSkillInputs()` in `src/plugin.ts` combines manually supplied `loadedSkills` with discovered skills after normalization.
5. `createCommandInjectHooks()` in `src/plugin/command-inject.ts` instantiates enabled source adapters and calls `aggregateCommandSources()` from `src/command-sources/aggregator.ts`.
6. The returned hooks inject command definitions during `config` and inject rendered command text during `command.execute.before`.

**Command Source Loading Flow:**

1. `src/plugin/command-inject.ts` constructs `MakefileCommandSource`, `NpmScriptsCommandSource`, and/or `SkillCommandSource` based on `CommandInjectConfig`.
2. `aggregateCommandSources()` in `src/command-sources/aggregator.ts` calls `source.load(context)` for each adapter concurrently.
3. Each adapter reads project inputs from `options.projectRoot` / `ctx.rootDir` and emits normalized `CommandInfo` objects.
4. `aggregateCommandSources()` preserves source order and drops duplicate command names with a warning.
5. `src/plugin/command-inject.ts` merges dynamic commands with existing commands, then builds a `Map<string, CommandInfo>` catalog for hook-time lookups.

**Configuration Resolution Flow:**

1. `src/config/loader.ts` checks `OPENCODE_COMMAND_INJECT_CONFIG` first.
2. If the env path does not produce a valid config, it loads user config from `~/.config/opencode/opencode-command-inject.jsonc|.json`.
3. It then loads project overrides from `<project>/.opencode/opencode-command-inject.jsonc|.json`.
4. `deepMerge()` in `src/config/loader.ts` merges nested `sources` entries so per-source overrides layer onto user defaults.

**Skill Discovery Flow:**

1. `getSkillRoots()` in `src/skills/discovery.ts` builds an ordered search list across project and home skill directories.
2. `discoverSkills()` recursively traverses each root through `scanDirectory()`.
3. `loadSkill()` in `src/skills/load-skill.ts` reads `<skill-dir>/SKILL.md`, parses optional frontmatter via `parseFrontmatter()` in `src/skills/frontmatter.ts`, and builds a command template.
4. `applyNamespace()` in `src/skills/discovery.ts` converts nested paths into names like `skill:a:b`.
5. `SkillCommandSource` in `src/command-sources/skill-source.ts` turns loaded skill definitions into command entries consumable by the plugin layer.

**State Management:**
- Runtime state is ephemeral and request-scoped.
- `src/plugin.ts` uses local arrays/sets to merge skill inputs.
- `src/plugin/command-inject.ts` uses `Set` and `Map` instances (`injectedNames`, `existingNames`, `catalog`) to track deduplication and hook-time lookup.
- No persistent application state or background process exists inside `src/`.

## Key Abstractions

**Plugin Factory:**
- Purpose: Convert plugin options and OpenCode context into hook functions
- Examples: `createCommandInjectPlugin()` in `src/plugin.ts`, `CommandInjectPlugin` in `src/plugin.ts`
- Pattern: Factory function returning an async OpenCode plugin initializer

**Command Source Interface:**
- Purpose: Standardize how command providers load commands
- Examples: `CommandSource`, `CommandInfo`, and `LoadContext` in `src/command-sources/types.ts`; implementations in `src/command-sources/makefile-source.ts`, `src/command-sources/npm-scripts-source.ts`, `src/command-sources/skill-source.ts`
- Pattern: Strategy/adapter interface with pluggable implementations

**Config Schema Boundary:**
- Purpose: Keep raw config parsing and runtime validation separate from plugin logic
- Examples: `CommandInjectConfigSchema` in `src/config/schema.ts`, `loadPluginConfig()` in `src/config/loader.ts`, generated JSON schema in `opencode-command-inject.schema.json`
- Pattern: Parse → validate → merge → pass typed config downstream

**Skill Definition Pipeline:**
- Purpose: Turn filesystem-based skill folders into normalized command metadata
- Examples: `loadSkill()` in `src/skills/load-skill.ts`, `parseFrontmatter()` in `src/skills/frontmatter.ts`, `normalizeSkillName()` in `src/skills/normalize-skill-name.ts`
- Pattern: Filesystem discovery + normalization + namespacing pipeline

**Template Assembly:**
- Purpose: Build final command text from defaults, config overrides, and runtime arguments
- Examples: `buildShellTemplate()`, `buildConfiguredTemplate()`, and `injectCommandArguments()` in `src/command-sources/template.ts`
- Pattern: Two-stage templating (build at startup, inject arguments at execution)

## Entry Points

**Published Module Entry:**
- Location: `index.ts`
- Triggers: npm/package import by OpenCode or other consumers
- Responsibilities: Re-export the plugin factory and types only

**Plugin Initialization Entry:**
- Location: `src/plugin.ts`
- Triggers: OpenCode invoking the plugin function with `{ directory, client, project, ... }`
- Responsibilities: Load config, decide discovery behavior, merge skill inputs, return command injection hooks

**Hook Construction Entry:**
- Location: `src/plugin/command-inject.ts`
- Triggers: `src/plugin.ts` after config and skill inputs are ready
- Responsibilities: Build enabled sources, aggregate commands, return `config` and `command.execute.before` hooks

**Schema Generation Entry:**
- Location: `scripts/generate-schema.ts`
- Triggers: `bun run generate-schema` and CI in `.github/workflows/test.yml`
- Responsibilities: Convert `CommandInjectConfigSchema` from `src/config/schema.ts` into `opencode-command-inject.schema.json`

## Error Handling

**Strategy:** Fail soft on optional project inputs, return safe defaults, and warn instead of throwing for recoverable loading problems.

**Patterns:**
- Source adapters in `src/command-sources/makefile-source.ts` and `src/command-sources/npm-scripts-source.ts` treat missing files as empty command lists.
- `src/config/loader.ts` returns `{}` or `null` on invalid/missing config rather than aborting plugin startup.
- `src/skills/discovery.ts` logs and skips unreadable directories or malformed skill folders while continuing the scan.
- Duplicate command/skill conflicts are handled through warnings plus "keep first" behavior in `src/plugin.ts`, `src/plugin/command-inject.ts`, `src/command-sources/aggregator.ts`, and `src/command-sources/skill-source.ts`.

## Cross-Cutting Concerns

**Logging:** Warning-oriented console logging. `src/plugin.ts`, `src/plugin/command-inject.ts`, `src/config/loader.ts`, and `src/skills/discovery.ts` emit `[command-inject] ...` messages; `src/command-sources/*.ts` emits `[command-sources] ...` messages.

**Validation:** Runtime config validation is centralized in `src/config/schema.ts` with `zod`; skill metadata validation is lightweight and occurs through frontmatter parsing plus blank-body checks in `src/skills/load-skill.ts`.

**Authentication:** Not applicable inside this package. The plugin operates on local filesystem inputs and OpenCode hook APIs only.

---

*Architecture analysis: 2026-03-26*
