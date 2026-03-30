# Architecture

**Analysis Date:** 2026-03-30

## Pattern Overview

**Overall:** Source-aggregation plugin with pipeline-style loading and hook-based command injection.

**Key Characteristics:**
- `index.ts` is a thin package entry that re-exports the plugin factory from `src/plugin.ts`.
- `src/plugin.ts` orchestrates config loading, optional skill discovery, manual/discovered skill merging, and hook construction.
- `src/plugin/command-inject.ts` is the runtime composition layer that instantiates enabled sources, aggregates commands, resolves collisions, mutates OpenCode config, and expands command templates at execution time.

## Layers

**Package Entry Layer:**
- Purpose: Expose the public plugin API consumed by OpenCode.
- Location: `index.ts`
- Contains: Re-exports for `CommandInjectPlugin`, `createCommandInjectPlugin`, and `CommandInjectPluginOptions`.
- Depends on: `src/plugin.ts`
- Used by: Package consumers through the `module` entry in `package.json`.

**Plugin Orchestration Layer:**
- Purpose: Build plugin instances and decide which runtime inputs should feed command injection.
- Location: `src/plugin.ts`
- Contains: `createCommandInjectPlugin()`, `mergeSkillInputs()`, and the default `CommandInjectPlugin` export.
- Depends on: `src/config/index.ts`, `src/skills/discovery.ts`, `src/skills/normalize-skill-name.ts`, `src/plugin/command-inject.ts`.
- Used by: `index.ts` and tests in `src/plugin.test.ts`.

**Hook Assembly Layer:**
- Purpose: Translate loaded inputs into OpenCode hooks.
- Location: `src/plugin/command-inject.ts`
- Contains: `createCommandInjectHooks()` plus collision resolution for dynamic commands against existing commands and config commands.
- Depends on: `src/command-sources/index.ts`, `src/command-sources/template.ts`, `src/config/types.ts`.
- Used by: `src/plugin.ts` and tests in `src/plugin/command-inject.test.ts`.

**Command Source Layer:**
- Purpose: Provide a uniform interface for each command-producing source.
- Location: `src/command-sources/`
- Contains: `CommandSource` contract in `src/command-sources/types.ts`, source implementations in `src/command-sources/makefile-source.ts`, `src/command-sources/npm-scripts-source.ts`, and `src/command-sources/skill-source.ts`, plus helpers like `src/command-sources/aggregator.ts`, `src/command-sources/command-name-prefix.ts`, `src/command-sources/template.ts`, `src/command-sources/npm-scripts-runner.ts`, `src/command-sources/makefile-parser.ts`, and `src/command-sources/variable-substitution.ts`.
- Depends on: Node filesystem/path APIs, config types, and skill helpers.
- Used by: `src/plugin/command-inject.ts`.

**Config Layer:**
- Purpose: Load, validate, and merge plugin configuration from env-selected, user-level, and project-level files.
- Location: `src/config/`
- Contains: Loader in `src/config/loader.ts`, schema in `src/config/schema.ts`, comment stripping in `src/config/strip-json-comments.ts`, and shared TS types in `src/config/types.ts`.
- Depends on: `zod`, Node filesystem/path APIs.
- Used by: `src/plugin.ts`, schema generation in `scripts/generate-schema.ts`, and tests in `src/config/*.test.ts`.

**Skill Discovery Layer:**
- Purpose: Walk skill roots, parse `SKILL.md`, namespace discovered skills, and normalize names before injection.
- Location: `src/skills/`
- Contains: Discovery in `src/skills/discovery.ts`, file loading in `src/skills/load-skill.ts`, frontmatter parsing in `src/skills/frontmatter.ts`, naming helpers in `src/skills/normalize-skill-name.ts`, and types in `src/skills/types.ts`.
- Depends on: Node filesystem/path APIs and `src/command-sources/errors.ts`.
- Used by: `src/plugin.ts` and `src/command-sources/skill-source.ts`.

## Data Flow

**Plugin startup → injected command catalog:**

1. OpenCode loads the exported plugin from `index.ts`, which delegates to `createCommandInjectPlugin()` in `src/plugin.ts`.
2. `src/plugin.ts` calls `loadPluginConfig(ctx.directory)` from `src/config/loader.ts` to build an effective config from `OPENCODE_COMMAND_INJECT_CONFIG`, `~/.config/opencode/opencode-command-inject.{jsonc,json}`, and `<project>/.opencode/opencode-command-inject.{jsonc,json}`.
3. `src/plugin.ts` decides whether to run `discoverSkills()` from `src/skills/discovery.ts`, then merges discovered skills with any `loadedSkills` passed by the caller. Manual skills win on normalized-name collisions.
4. `src/plugin.ts` hands `projectRoot`, `config`, logger, existing commands, and merged skill inputs to `createCommandInjectHooks()` in `src/plugin/command-inject.ts`.
5. `src/plugin/command-inject.ts` instantiates enabled sources (`MakefileCommandSource`, `NpmScriptsCommandSource`, `SkillCommandSource`) and calls `aggregateCommandSources()` in `src/command-sources/aggregator.ts`.
6. Each source reads its backing artifact (`Makefile`, `package.json`, or loaded skill definitions), builds canonical/configured names via `src/command-sources/command-name-prefix.ts`, and returns `CommandInfo` records.
7. `aggregateCommandSources()` merges same-name dynamic commands, optionally falling back to canonical names when customized names collide across sources, and logs warnings with the `[command-sources]` prefix.
8. `src/plugin/command-inject.ts` runs a second collision pass against `existingCommands` and later against `config.command`, logging with the `[command-inject]` prefix and skipping reserved names when fallback still collides.
9. The returned `config` hook injects the surviving command templates into `config.command` and records which names were added in `injectedNames`.

**Injected command execution:**

1. OpenCode invokes the `command.execute.before` hook returned from `src/plugin/command-inject.ts`.
2. The hook ignores commands not recorded in `injectedNames`.
3. For injected commands, it loads the `CommandInfo` from `catalog`, calls `injectCommandArguments()` from `src/command-sources/template.ts`, and prepends the expanded text to `output.parts`.
4. Templates generated by `src/command-sources/makefile-source.ts`, `src/command-sources/npm-scripts-source.ts`, and `src/command-sources/skill-source.ts` therefore turn OpenCode command arguments into final shell or skill instructions.

**Skill discovery flow:**

1. `getSkillRoots()` in `src/skills/discovery.ts` defines ordered roots: `<project>/.opencode/skills`, `~/.config/opencode/skills`, `<project>/.claude/skills`, `<project>/.agents/skills`, `~/.claude/skills`, `~/.agents/skills`.
2. `scanDirectory()` recursively visits directories, resolving symlinked directories and deduplicating by `realpath()`.
3. Each candidate directory is passed to `loadSkill()` in `src/skills/load-skill.ts`, which reads `SKILL.md`, parses optional frontmatter through `src/skills/frontmatter.ts`, and wraps the body in a command template.
4. `applyNamespace()` in `src/skills/discovery.ts` prefixes nested skill paths as colon-separated command namespaces such as `skill:a:b`.
5. `normalizeSkillName()` in `src/skills/normalize-skill-name.ts` strips the `skill:` prefix for dedupe comparisons before the discovered result is returned to `src/plugin.ts`.

**State Management:**
- Runtime state is ephemeral and function-scoped. `src/plugin/command-inject.ts` keeps `catalog` and `injectedNames` in closure state per plugin instance instead of using global state.
- Configuration is recomputed at plugin initialization via `src/config/loader.ts`; no persistent cache exists inside `src/`.
- Command ordering is preserved by insertion order in `src/command-sources/aggregator.ts` and by source instantiation order in `src/plugin/command-inject.ts`.

## Key Abstractions

**Plugin Factory:**
- Purpose: Produce OpenCode-compatible plugin instances with optional manual skill injection.
- Examples: `src/plugin.ts`, `index.ts`
- Pattern: Factory function returning async plugin hooks.

**CommandSource:**
- Purpose: Standardize how heterogeneous sources load commands.
- Examples: `src/command-sources/types.ts`, `src/command-sources/makefile-source.ts`, `src/command-sources/npm-scripts-source.ts`, `src/command-sources/skill-source.ts`
- Pattern: Interface + concrete adapters.

**CommandInfo:**
- Purpose: Canonical runtime record for an injectable command, including name, description, template, source, and fallback naming metadata.
- Examples: `src/command-sources/types.ts`, `src/plugin/command-inject.ts`, `src/command-sources/aggregator.ts`
- Pattern: Plain data object passed through the pipeline.

**SourceConfig / CommandInjectConfig:**
- Purpose: Carry source toggles, prompt overrides, and command prefix options through all loading stages.
- Examples: `src/config/types.ts`, `src/config/schema.ts`, `src/config/loader.ts`
- Pattern: Schema-validated config object with layered merge.

**LoadedSkillDefinition / LoadedSkillCommandInput:**
- Purpose: Separate skill discovery payloads from the narrower command-source input consumed during injection.
- Examples: `src/skills/types.ts`, `src/plugin.ts`, `src/command-sources/types.ts`
- Pattern: Boundary DTOs between discovery/orchestration/source layers.

## Entry Points

**Package entry:**
- Location: `index.ts`
- Triggers: Package import by OpenCode or tests.
- Responsibilities: Re-export public plugin symbols only.

**Plugin constructor:**
- Location: `src/plugin.ts`
- Triggers: `CommandInjectPlugin` initialization inside OpenCode.
- Responsibilities: Load config, optionally discover skills, merge manual/discovered skill inputs, and build hooks.

**Hook executor:**
- Location: `src/plugin/command-inject.ts`
- Triggers: Plugin constructor calling `createCommandInjectHooks()`.
- Responsibilities: Build enabled dynamic sources, aggregate commands, resolve collisions, inject `config.command`, and intercept command execution.

**Schema generation CLI:**
- Location: `scripts/generate-schema.ts`
- Triggers: `bun run generate-schema` from `package.json` and CI in `.github/workflows/test.yml`.
- Responsibilities: Convert `CommandInjectConfigSchema` from `src/config/schema.ts` into `opencode-command-inject.schema.json`.

## Error Handling

**Strategy:** Recoverable filesystem/config errors with warning logs and empty-result fallbacks.

**Patterns:**
- Missing optional inputs return empty results instead of throwing: `src/command-sources/makefile-source.ts`, `src/command-sources/npm-scripts-source.ts`, and `src/skills/load-skill.ts` all treat `ENOENT` as non-fatal.
- Invalid config is logged and replaced with `{}` in `src/config/loader.ts`; invalid project/user config does not abort plugin creation.
- Skill discovery logs warnings per unreadable directory or failed skill load in `src/skills/discovery.ts` and continues scanning remaining roots.
- Collision handling is explicit and non-destructive in `src/command-sources/aggregator.ts` and `src/plugin/command-inject.ts`: canonical fallback is attempted first, then existing commands are preserved.

## Cross-Cutting Concerns

**Logging:** Warnings use `[command-inject]` in `src/plugin.ts`, `src/plugin/command-inject.ts`, and `src/config/loader.ts`; source-level merge and load warnings use `[command-sources]` in `src/command-sources/*`.

**Validation:** Config validation is centralized in `src/config/schema.ts` and applied in `src/config/loader.ts`. Skill frontmatter validation is intentionally narrow in `src/skills/frontmatter.ts`, which only extracts `name` and `description`.

**Authentication:** Not applicable inside this plugin codebase. The only environment-driven input is the config file path `OPENCODE_COMMAND_INJECT_CONFIG` in `src/config/loader.ts`.

---

*Architecture analysis: 2026-03-30*
