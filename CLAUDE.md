<!-- GSD:project-start source:PROJECT.md -->
## Project

**opencode-command-inject**

`opencode-command-inject` is an OpenCode plugin that scans a project for Makefile targets, package scripts, and local skills, then injects them as slash commands at startup. This milestone extends the existing brownfield plugin so users can control whether generated command names keep a source prefix such as `/make:build`, `/pnpm:dev`, or `/skill:review`.

**Core Value:** Users can expose project commands in OpenCode with predictable, configurable names without breaking the plugin's existing discovery and injection workflow.

### Constraints

- **Compatibility**: Existing users with no new config must keep the current prefixed command naming behavior
- **Configuration Shape**: New settings must fit the existing top-level config plus `sources.<source>` pattern — no separate naming namespace
- **Naming Format**: Custom prefixes must render as `prefix:name`
- **Collision Handling**: If removing or changing prefixes causes a collision, affected commands must fall back to source prefix naming
- **Documentation**: `README.md`, `docs/configuration.md`, and `opencode-command-inject.schema.json` must stay aligned with runtime behavior
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript (ESM) - plugin source and tests in `index.ts`, `src/**/*.ts`, and `scripts/generate-schema.ts`
- JavaScript - ESLint flat config in `eslint.config.js`
- JSON / JSON Schema - package and release metadata in `package.json`, `release-please-config.json`, `.release-please-manifest.json`, `skills-lock.json`, and `opencode-command-inject.schema.json`
- YAML - CI/CD workflows in `.github/workflows/test.yml`, `.github/workflows/release-please.yml`, and `.github/workflows/release-npm.yml`
- Markdown - user and config docs in `README.md` and `docs/configuration.md`
## Runtime
- Bun runtime/tooling for local development and script execution, defined in `package.json` scripts and used by `.github/workflows/test.yml`
- Node.js runtime compatibility for publishing, with Node 24 set in `.github/workflows/release-npm.yml`
- Bun - primary package manager for this repository via `bun.lock` and `package.json`
- Lockfile: present in `bun.lock`
## Frameworks
- `@opencode-ai/plugin` - OpenCode plugin API used by `src/plugin.ts` and `src/plugin/command-inject.ts` to register hooks and inject commands
- `zod` - runtime config validation in `src/config/schema.ts`
- Vitest - test runner configured via `package.json` and exercised by `src/**/*.test.ts`
- TypeScript (`tsc --noEmit`) - strict type-checking configured in `tsconfig.json`
- ESLint flat config - linting in `eslint.config.js`
- `zod-to-json-schema` - schema generation in `scripts/generate-schema.ts`
- Release Please - automated versioning configured in `release-please-config.json` and `.github/workflows/release-please.yml`
## Key Dependencies
- `@opencode-ai/plugin` (`^1.2.15`) - defines the plugin contract consumed by `src/plugin.ts` and `src/plugin/command-inject.ts`
- `zod` (`^3.25.0`) - validates user/project config structures in `src/config/schema.ts` before merge/use in `src/config/loader.ts`
- `@opencode-ai/sdk` (`^1.2.15`) - development dependency for OpenCode ecosystem compatibility, declared in `package.json`
- `typescript` (`^5.7.3`) - compiler/type system for `src/**/*.ts`
- `vitest` (`^3.2.4`) - automated tests for plugin, config, skills, and command sources in `src/**/*.test.ts`
- `eslint`, `@eslint/js`, `@typescript-eslint/*` - lint pipeline defined in `eslint.config.js`
- `zod-to-json-schema` (`3.24.1`) - emits `opencode-command-inject.schema.json` from `src/config/schema.ts`
## Configuration
- Optional override: `OPENCODE_COMMAND_INJECT_CONFIG` selects a single config file path in `src/config/loader.ts` and `docs/configuration.md`
- Optional config-root override: `XDG_CONFIG_HOME` changes user config lookup in `src/config/loader.ts`
- Project config path: `.opencode/opencode-command-inject.jsonc` or `.opencode/opencode-command-inject.json`, documented in `docs/configuration.md`
- User config path: `~/.config/opencode/opencode-command-inject.jsonc` or `.json`, documented in `docs/configuration.md`
- TypeScript compiler options in `tsconfig.json`
- Lint rules in `eslint.config.js`
- Package entry/export metadata in `package.json`
- Generated schema artifact in `opencode-command-inject.schema.json`
- Release automation in `release-please-config.json` and `.github/workflows/release-please.yml`
- npm publish automation in `.github/workflows/release-npm.yml`
## Platform Requirements
- Bun installed to run `bun install`, `bun run typecheck`, `bun run lint`, `bun run test`, and `bun run generate-schema` from `package.json`
- OpenCode CLI/plugin host available for real plugin usage, referenced in `README.md`
- File system access to project roots and skill directories because sources read `Makefile`, `package.json`, and `SKILL.md` files in `src/command-sources/*.ts` and `src/skills/*.ts`
- Distributed as an npm package for OpenCode plugin loading, with package entry `index.ts` in `package.json`
- Published to npm registry through `.github/workflows/release-npm.yml`
- Consumed by OpenCode through config references shown in `README.md`
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- Use kebab-case for source and test files in `src/`, such as `src/command-sources/makefile-source.ts`, `src/skills/normalize-skill-name.ts`, and `src/plugin/command-inject.test.ts`.
- Use uppercase fixed names only for convention-driven files outside `src/`, such as `AGENTS.md` and `README.md`.
- Use camelCase for functions and helpers, such as `mergeSkillInputs` in `src/plugin.ts`, `loadPluginConfig` in `src/config/loader.ts`, and `detectNpmScriptsRunner` in `src/command-sources/npm-scripts-runner.ts`.
- Exported helpers usually declare explicit return types, for example `createCommandInjectHooks(...): Promise<Partial<Hooks>>` in `src/plugin/command-inject.ts` and `withTempDir(...): Promise<void>` in `src/test-utils/temp-dir.ts`.
- Use camelCase for local variables, including descriptive path names such as `makefilePath` in `src/command-sources/makefile-source.ts`, `packageJsonPath` in `src/command-sources/npm-scripts-source.ts`, and `projectConfigBasePath` in `src/config/loader.ts`.
- Use `UPPER_SNAKE_CASE` only for true constants, such as `CONFIG_FILE_NAME` and `ENV_CONFIG_PATH` in `src/config/loader.ts` and `SHELL_TEMPLATE_PREFIX` in `src/command-sources/template.ts`.
- Use PascalCase for interfaces and type aliases, such as `CommandInfo` in `src/command-sources/types.ts`, `CommandInjectConfig` in `src/config/types.ts`, and `LoadedSkillDefinition` in `src/skills/types.ts`.
- Keep simple shared types in nearby `types.ts` files, then re-export through barrel files like `src/command-sources/index.ts` and `src/config/index.ts`.
## Code Style
- Follow the repository’s TypeScript style visible in `src/plugin.ts`, `src/plugin/command-inject.ts`, and `src/skills/discovery.ts`:
- Favor multiline wrapping for long conditions and argument lists, as in `src/plugin/command-inject.ts` lines 37-43 and `src/config/loader.ts` lines 71-76.
- Use ESLint from `eslint.config.js`.
- Repository-wide ignores: `.opencode/**` and `**/*.js` in `eslint.config.js`.
- Type-aware linting applies to `src/**/*.ts` via `parserOptions.project` in `eslint.config.js`.
- Enforced rules visible in config:
- There is one explicit local suppression in `src/plugin/command-inject.ts` for `output.parts.unshift(... as any)`. Treat this as an exception, not a general pattern.
## Import Organization
- No path aliases are configured in `tsconfig.json`; use relative imports like `./types`, `../config`, and `./plugin/command-inject`.
## Error Handling
- Treat missing optional files as non-fatal and return safe defaults. Examples:
- Narrow filesystem errors with `isErrnoException` from `src/command-sources/errors.ts` before checking `error.code`.
- Prefer logging plus fallback behavior over throwing for recoverable cases, as in `src/config/loader.ts` and `src/skills/discovery.ts`.
## Logging
- Source-loading code logs through injected `warn` functions, not direct `console.warn`, for example `ctx.logger.warn(...)` in `src/command-sources/makefile-source.ts`, `src/command-sources/npm-scripts-source.ts`, and `src/command-sources/skill-source.ts`.
- Top-level config/plugin code uses `console.warn(...)` with consistent prefixes in `src/config/loader.ts` and `src/plugin.ts`.
- Keep message prefixes stable:
## Comments
- Keep comments minimal and use them only where behavior is not obvious.
- Existing comments mostly explain edge cases or test intent, such as namespace rules in `src/skills/discovery.ts` and behavior-focused notes in `src/plugin/command-inject.test.ts`.
- Not used in the production code inspected under `src/`. Prefer clear names and types over block documentation.
## Function Design
- Prefer small focused helpers and single-purpose methods. Good reference points:
- Pass structured option objects when a function has several related inputs, such as `CommandInjectOptions` in `src/plugin/command-inject.ts`, `DiscoveryOptions` in `src/skills/types.ts`, and `LoadContext` in `src/command-sources/types.ts`.
- Use optional config objects for extensibility, such as `SourceConfig` in `src/config/types.ts`.
- Use explicit safe return shapes instead of exceptions for routine absence or parse failures:
## Module Design
- Prefer named exports throughout the codebase. No default exports appear in `src/`.
- Public module surfaces are collected in barrel files like `src/command-sources/index.ts` and `src/config/index.ts`.
- Use barrel files selectively for feature entry points. Current examples:
- Import directly from implementation files when the caller is inside the same feature area, such as `src/plugin.ts` importing `./plugin/command-inject`.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- `index.ts` is a minimal package entry that re-exports the plugin surface from `src/plugin.ts`
- `src/plugin.ts` orchestrates startup by loading config, discovering skills, merging manual/discovered skill inputs, and delegating hook creation to `src/plugin/command-inject.ts`
- `src/command-sources/*.ts` implements one adapter per command source (`Makefile`, `package.json` scripts, discovered skills) behind the shared `CommandSource` interface in `src/command-sources/types.ts`
## Layers
- Purpose: Expose the public npm/plugin API without business logic
- Location: `index.ts`
- Contains: Re-exports for `CommandInjectPlugin`, `createCommandInjectPlugin`, and `CommandInjectPluginOptions`
- Depends on: `src/plugin.ts`
- Used by: OpenCode plugin loading and package consumers
- Purpose: Convert OpenCode plugin context into configured runtime hooks
- Location: `src/plugin.ts`, `src/plugin/command-inject.ts`
- Contains: Plugin factory, source enable/disable decisions, manual/discovered skill merge logic, OpenCode hook implementations
- Depends on: `src/config/index.ts`, `src/skills/discovery.ts`, `src/skills/normalize-skill-name.ts`, `src/command-sources/index.ts`, `src/command-sources/template.ts`
- Used by: `index.ts` and OpenCode's plugin runtime
- Purpose: Load commands from heterogeneous project inputs and normalize them into `CommandInfo`
- Location: `src/command-sources/`
- Contains: `MakefileCommandSource` in `src/command-sources/makefile-source.ts`, `NpmScriptsCommandSource` in `src/command-sources/npm-scripts-source.ts`, `SkillCommandSource` in `src/command-sources/skill-source.ts`, plus aggregation and template helpers
- Depends on: Node filesystem/path APIs, `src/skills/normalize-skill-name.ts`, `src/config/types.ts`
- Used by: `src/plugin/command-inject.ts`
- Purpose: Load, validate, and merge user/project configuration for source behavior
- Location: `src/config/`
- Contains: Config loader in `src/config/loader.ts`, schema in `src/config/schema.ts`, types in `src/config/types.ts`, JSONC preprocessing in `src/config/strip-json-comments.ts`
- Depends on: `zod`, Node `fs`, `os`, and `path`
- Used by: `src/plugin.ts`, `scripts/generate-schema.ts`
- Purpose: Scan supported skill roots, parse `SKILL.md`, and convert nested directories into namespaced skill definitions
- Location: `src/skills/`
- Contains: Recursive discovery in `src/skills/discovery.ts`, frontmatter parsing in `src/skills/frontmatter.ts`, `SKILL.md` loading in `src/skills/load-skill.ts`, name normalization in `src/skills/normalize-skill-name.ts`
- Depends on: Node filesystem/path APIs and `src/command-sources/errors.ts`
- Used by: `src/plugin.ts`, `src/command-sources/skill-source.ts`
- Purpose: Exercise each layer with focused Vitest coverage and temporary filesystem helpers
- Location: `src/**/*.test.ts`, `src/test-utils/temp-dir.ts`
- Contains: Source-level tests, plugin integration tests, temp directory/file helpers
- Depends on: `vitest`, Node temporary filesystem utilities
- Used by: CI in `.github/workflows/test.yml`
## Data Flow
- Runtime state is ephemeral and request-scoped.
- `src/plugin.ts` uses local arrays/sets to merge skill inputs.
- `src/plugin/command-inject.ts` uses `Set` and `Map` instances (`injectedNames`, `existingNames`, `catalog`) to track deduplication and hook-time lookup.
- No persistent application state or background process exists inside `src/`.
## Key Abstractions
- Purpose: Convert plugin options and OpenCode context into hook functions
- Examples: `createCommandInjectPlugin()` in `src/plugin.ts`, `CommandInjectPlugin` in `src/plugin.ts`
- Pattern: Factory function returning an async OpenCode plugin initializer
- Purpose: Standardize how command providers load commands
- Examples: `CommandSource`, `CommandInfo`, and `LoadContext` in `src/command-sources/types.ts`; implementations in `src/command-sources/makefile-source.ts`, `src/command-sources/npm-scripts-source.ts`, `src/command-sources/skill-source.ts`
- Pattern: Strategy/adapter interface with pluggable implementations
- Purpose: Keep raw config parsing and runtime validation separate from plugin logic
- Examples: `CommandInjectConfigSchema` in `src/config/schema.ts`, `loadPluginConfig()` in `src/config/loader.ts`, generated JSON schema in `opencode-command-inject.schema.json`
- Pattern: Parse → validate → merge → pass typed config downstream
- Purpose: Turn filesystem-based skill folders into normalized command metadata
- Examples: `loadSkill()` in `src/skills/load-skill.ts`, `parseFrontmatter()` in `src/skills/frontmatter.ts`, `normalizeSkillName()` in `src/skills/normalize-skill-name.ts`
- Pattern: Filesystem discovery + normalization + namespacing pipeline
- Purpose: Build final command text from defaults, config overrides, and runtime arguments
- Examples: `buildShellTemplate()`, `buildConfiguredTemplate()`, and `injectCommandArguments()` in `src/command-sources/template.ts`
- Pattern: Two-stage templating (build at startup, inject arguments at execution)
## Entry Points
- Location: `index.ts`
- Triggers: npm/package import by OpenCode or other consumers
- Responsibilities: Re-export the plugin factory and types only
- Location: `src/plugin.ts`
- Triggers: OpenCode invoking the plugin function with `{ directory, client, project, ... }`
- Responsibilities: Load config, decide discovery behavior, merge skill inputs, return command injection hooks
- Location: `src/plugin/command-inject.ts`
- Triggers: `src/plugin.ts` after config and skill inputs are ready
- Responsibilities: Build enabled sources, aggregate commands, return `config` and `command.execute.before` hooks
- Location: `scripts/generate-schema.ts`
- Triggers: `bun run generate-schema` and CI in `.github/workflows/test.yml`
- Responsibilities: Convert `CommandInjectConfigSchema` from `src/config/schema.ts` into `opencode-command-inject.schema.json`
## Error Handling
- Source adapters in `src/command-sources/makefile-source.ts` and `src/command-sources/npm-scripts-source.ts` treat missing files as empty command lists.
- `src/config/loader.ts` returns `{}` or `null` on invalid/missing config rather than aborting plugin startup.
- `src/skills/discovery.ts` logs and skips unreadable directories or malformed skill folders while continuing the scan.
- Duplicate command/skill conflicts are handled through warnings plus "keep first" behavior in `src/plugin.ts`, `src/plugin/command-inject.ts`, `src/command-sources/aggregator.ts`, and `src/command-sources/skill-source.ts`.
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
