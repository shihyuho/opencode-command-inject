# AGENTS.md

Minimal guardrails for agents working in `opencode-command-inject`.

## Repo-specific constraints

- Preserve existing behavior on name collisions. Manual `loadedSkills` beat discovered skills, and injected commands must not overwrite existing commands or config-defined commands. Log a warning instead of silently replacing behavior.
- Treat config loading, skill discovery, and optional command sources as recoverable. Missing files, parse failures, and discovery issues should warn and fall back safely rather than crash the plugin.
- Keep warning prefixes consistent with existing runtime logs: `[command-inject]` and `[command-sources]`.
- If you change `src/config/types.ts` or `src/config/schema.ts`, run `bun run generate-schema` so `opencode-command-inject.schema.json` stays in sync with the published package.
- GSD wiki sync is a hard gate: before starting any GSD action, and again before reporting it complete, update `/Users/matt/code/github.com/softleader/agent-skills.wiki/GSD-Guide.md`. Treat it as the concise GSD guide for other team members. Do not claim a GSD action is done until this local wiki file has been updated.

<!-- GSD:project-start source:PROJECT.md -->
## Project

**opencode-command-inject**

`opencode-command-inject` 是一個 OpenCode 外掛，會從 Makefile、npm scripts 與 skills 等來源動態注入可執行指令，讓使用者在既有專案中快速暴露常用操作。它面向已經使用 OpenCode 與本地專案慣例的開發者，重點是以安全預設、可設定命名與可恢復的載入流程，把專案命令整合進 OpenCode。

**Core Value:** 在不破壞既有 OpenCode / 專案行為的前提下，穩定地把可發現、可設定的動態命令注入到使用者工作流中。

### Constraints

- **Tech stack**: 維持 TypeScript + Bun + Vitest + Zod 現有實作路徑 — 避免為單一功能引入不必要基礎設施變更
- **Compatibility**: 不可破壞既有 command collision / manual skill precedence / warning prefix 行為 — 這些是 repo hard rules 與既有測試契約
- **Schema contract**: 若變更 `src/config/types.ts` 或 `src/config/schema.ts`，必須同步執行 `bun run generate-schema` — AGENTS.md 明定的 hard gate
- **Resilience**: config 與 discovery 相關失敗要 warning + fallback，不可因缺檔或解析失敗讓 plugin crash — 符合既有 loader/discovery 設計
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.7.x - runtime and plugin implementation in `index.ts`, `src/plugin.ts`, `src/plugin/command-inject.ts`, `src/config/*.ts`, `src/command-sources/*.ts`, `src/skills/*.ts`
- JavaScript (ES modules) - lint configuration in `eslint.config.js`
- YAML - CI/CD workflows in `.github/workflows/test.yml`, `.github/workflows/release-please.yml`, `.github/workflows/release-npm.yml`
- JSON / JSON Schema - package metadata in `package.json`, release metadata in `release-please-config.json`, published config schema in `opencode-command-inject.schema.json`
- Markdown - operator docs in `README.md` and `docs/configuration.md`
## Runtime
- Bun runtime/tooling - scripts in `package.json`, Bun-specific typings in `tsconfig.json`, CI setup in `.github/workflows/test.yml`
- Node.js 24 - npm publish workflow in `.github/workflows/release-npm.yml`
- OpenCode plugin host - plugin entry exported from `index.ts` and `src/plugin.ts` via `@opencode-ai/plugin`
- Bun - install and script runner used by `package.json` scripts and GitHub Actions in `.github/workflows/test.yml`
- Lockfile: present (`bun.lock`)
## Frameworks
- `@opencode-ai/plugin` ^1.2.15 - OpenCode plugin API used in `src/plugin.ts` and `src/plugin/command-inject.ts`
- `zod` ^3.25.0 - runtime config validation and schema source in `src/config/schema.ts`
- Vitest ^3.2.4 - test runner referenced by `package.json` and used by `src/**/*.test.ts`
- TypeScript ^5.7.3 - static typecheck via `package.json` and `tsconfig.json`
- ESLint 9 + `@typescript-eslint/*` - linting via `eslint.config.js`
- `zod-to-json-schema` 3.24.1 - schema generation in `scripts/generate-schema.ts`
## Key Dependencies
- `@opencode-ai/plugin` - plugin contract for injecting commands into OpenCode from `src/plugin.ts`
- `zod` - validates config loaded by `src/config/loader.ts` and defines the published schema in `src/config/schema.ts`
- `@opencode-ai/sdk` - development dependency for OpenCode ecosystem compatibility from `package.json`
- `zod-to-json-schema` - publishes editor-consumable schema artifact from `scripts/generate-schema.ts`
- `@types/bun` - Bun runtime typings enabled in `tsconfig.json`
## Configuration
- Config path override uses `OPENCODE_COMMAND_INJECT_CONFIG` in `src/config/loader.ts`
- User config base directory uses `XDG_CONFIG_HOME` fallback to `~/.config` in `src/config/loader.ts`
- Supported config files are `.jsonc` and `.json` at `${XDG_CONFIG_HOME}/opencode/opencode-command-inject.*` and `.opencode/opencode-command-inject.*`, documented in `docs/configuration.md`
- Type checking: `package.json` → `bun run typecheck` using `tsconfig.json`
- Linting: `package.json` → `bun run lint` using `eslint.config.js`
- Schema generation: `package.json` → `bun run generate-schema` using `scripts/generate-schema.ts` to refresh `opencode-command-inject.schema.json`
- Test workflow enforces schema freshness in `.github/workflows/test.yml`
## Platform Requirements
- Bun installed locally for `bun install`, `bun run test`, `bun run lint`, `bun run typecheck`, and `bun run generate-schema` from `package.json`
- OpenCode CLI/plugin environment for real plugin usage, documented in `README.md`
- Published as an npm package with plugin entry `index.ts` and packaged files listed in `package.json`
- Release automation uses Release Please in `.github/workflows/release-please.yml` and npm publish with provenance in `.github/workflows/release-npm.yml`
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- Use kebab-case for implementation and test files in `src/`, such as `src/command-sources/npm-scripts-source.ts`, `src/config/strip-json-comments.ts`, and `src/plugin/command-inject.test.ts`.
- Keep related tests co-located with implementation using the same basename plus `.test.ts`, such as `src/config/schema.ts` + `src/config/schema.test.ts` and `src/skills/discovery.ts` + `src/skills/discovery.test.ts`.
- Use camelCase for functions and helpers, such as `createCommandInjectPlugin` in `src/plugin.ts`, `buildCommandName` in `src/command-sources/command-name-prefix.ts`, and `loadPluginConfig` in `src/config/loader.ts`.
- Use verb-first names for behavior and boolean-style names for control flags, such as `mergeSkillInputs`, `resolveDynamicCommandCollisions`, `getEnvConfigPath`, and `shouldDiscover` in `src/plugin.ts` / `src/config/loader.ts`.
- Use camelCase for locals and params, including descriptive intermediate names like `existingResolvedDynamicCommands` in `src/plugin/command-inject.ts` and `sourceCommandNamePrefix` in `src/command-sources/command-name-prefix.ts`.
- Reserve UPPER_SNAKE_CASE for module constants, such as `ENV_CONFIG_PATH` and `CONFIG_FILE_NAME` in `src/config/loader.ts` and `SKILL_PREFIX` in `src/skills/discovery.ts`.
- Use PascalCase for interfaces and exported types, such as `CommandInjectConfig` in `src/config/types.ts`, `CommandInfo` in `src/command-sources/types.ts`, and `LoadedSkillDefinition` in `src/skills/types.ts`.
- Prefer `interface` for object shapes and `type` for unions/aliases, such as `PackageManager` in `src/command-sources/npm-scripts-runner.ts`.
## Code Style
- No formatter config is detected. Match the existing style in `src/**/*.ts`: two-space indentation, semicolon-free statements, double quotes, and trailing commas only where TypeScript syntax naturally keeps them.
- Keep short guard clauses and early returns, as seen in `src/config/loader.ts`, `src/skills/load-skill.ts`, and `src/command-sources/skill-source.ts`.
- ESLint is configured in `eslint.config.js` with `@eslint/js` and `@typescript-eslint` for `src/**/*.ts`.
- Follow repo lint rules from `eslint.config.js`: `@typescript-eslint/no-explicit-any` is an error, `no-undef` is off, and `no-console` is off.
- Treat the single `any` exception in `src/plugin/command-inject.ts` line 194 as a narrowly-scoped escape hatch; if another escape is required, isolate it and document it with an inline disable comment.
## TypeScript Strictness
- `tsconfig.json` enables `strict: true`, `noEmit: true`, `moduleResolution: "Bundler"`, and Bun/Vitest types.
- Use explicit return types on exported functions and methods, such as `loadPluginConfig(...): Promise<CommandInjectConfig>` in `src/config/loader.ts` and `load(...): Promise<CommandInfo[]>` in source classes under `src/command-sources/`.
- Prefer `import type` for type-only imports, as seen in `src/plugin.ts`, `src/plugin/command-inject.ts`, and `src/command-sources/skill-source.ts`.
## Import Organization
- No path aliases are configured in `tsconfig.json`. Use relative imports like `./config`, `../command-sources`, and `./skills/discovery`.
## Error Handling
- Prefer recoverable failures with warnings instead of throwing for optional inputs and discovery/config paths. Examples: `src/config/loader.ts`, `src/command-sources/makefile-source.ts`, `src/command-sources/npm-scripts-source.ts`, and `src/skills/discovery.ts`.
- Use `safeParse` for user config validation in `src/config/schema.ts` + `src/config/loader.ts` instead of throwing parse errors into runtime flow.
- Branch on `ENOENT` explicitly for optional files/directories, using `isErrnoException` in `src/command-sources/errors.ts` and direct errno checks in `src/config/loader.ts` / `src/skills/load-skill.ts`.
- Preserve existing behavior on collisions and duplicates by warning and keeping the existing/manual/first command rather than overwriting it. This rule is implemented in `src/plugin.ts`, `src/plugin/command-inject.ts`, and `src/command-sources/aggregator.ts`.
## Logging
- Route runtime warnings through `logger.warn(...)` where a logger is available, then back it with `console.warn` at plugin boundary in `src/plugin.ts`.
- Keep warning prefixes stable: use `[command-inject]` for plugin/config/injection warnings in `src/plugin.ts`, `src/plugin/command-inject.ts`, and `src/config/loader.ts`; use `[command-sources]` for source aggregation/loading warnings in `src/command-sources/aggregator.ts`, `src/command-sources/makefile-source.ts`, `src/command-sources/npm-scripts-source.ts`, and `src/command-sources/skill-source.ts`.
- Use `logger.debug?.(...)` only for optional lower-severity tracing, as in duplicate discovered skill handling in `src/skills/discovery.ts`.
## Comments
- Most code is self-descriptive and comment-light.
- Add comments only when documenting non-obvious edge cases or fallback behavior, such as namespacing notes in `src/skills/discovery.ts` and collision/fallback intent in tests like `src/plugin/command-inject.test.ts`.
- Not used. Follow the existing pattern of expressive names plus focused inline comments instead of block docs.
## Function Design
- Keep helpers small and focused where possible, such as `buildSkillTemplate` in `src/skills/load-skill.ts`, `getEnvConfigPath` in `src/config/loader.ts`, and `injectCommandArguments` in `src/command-sources/template.ts`.
- Larger orchestrators may stay in one file when they centralize policy, such as `createCommandInjectHooks` in `src/plugin/command-inject.ts` and `discoverSkills` in `src/skills/discovery.ts`.
- Prefer a single options object for exported orchestration APIs, such as `createCommandInjectPlugin(options)` in `src/plugin.ts`, `buildCommandName({...})` in `src/command-sources/command-name-prefix.ts`, and `discoverSkills(options)` in `src/skills/discovery.ts`.
- Use constructor injection for per-source config, as in `src/command-sources/makefile-source.ts`, `src/command-sources/npm-scripts-source.ts`, and `src/command-sources/skill-source.ts`.
- Return empty collections or `{}` for recoverable missing state instead of null-heavy APIs, such as `loadPluginConfig` in `src/config/loader.ts` and `load()` methods in `src/command-sources/*-source.ts`.
- Use `null` only when absence is semantically meaningful, such as `loadSkill(...): Promise<LoadedSkillDefinition | null>` in `src/skills/load-skill.ts`.
## Module Design
- Prefer named exports from implementation files, such as `CommandInjectPlugin` and `createCommandInjectPlugin` in `src/plugin.ts`.
- Re-export public config and command-source surface from index files like `index.ts`, `src/config/index.ts`, and `src/command-sources/index.ts`.
- Barrel files are used sparingly for public API edges only. Add them only when consolidating a stable surface, not for every folder.
## Config / Schema Conventions
- Keep runtime config shape in `src/config/types.ts` aligned with validation in `src/config/schema.ts`.
- Validate user-facing config with strict Zod objects (`.strict()`) in `src/config/schema.ts`.
- Keep top-level `command_name_prefix` disable-only, and keep per-source `command_name_prefix` as `{ disable?, value? }`, matching `src/config/types.ts`, `src/config/schema.ts`, and assertions in `src/config/types.test.ts` / `src/config/schema.test.ts`.
- If `src/config/types.ts` or `src/config/schema.ts` changes, run `bun run generate-schema` so `opencode-command-inject.schema.json` stays synchronized. This is a repo hard rule from `AGENTS.md`, implemented by `scripts/generate-schema.ts`, and verified in `src/config/schema.test.ts`.
- Keep config loading resilient: support `.jsonc` and `.json`, deep-merge project config over user config, and let `OPENCODE_COMMAND_INJECT_CONFIG` override defaults as implemented in `src/config/loader.ts` and tested in `src/config/loader.test.ts`.
## Repo-Specific Guardrails
- Preserve existing behavior on name collisions. Manual `loadedSkills` beat discovered skills in `src/plugin.ts`, and injected commands must not overwrite existing commands or config-defined commands in `src/plugin/command-inject.ts`.
- Treat config loading, skill discovery, and optional command sources as recoverable. Missing files, parse failures, and discovery issues must warn and fall back safely rather than crash; follow patterns in `src/config/loader.ts`, `src/skills/discovery.ts`, and `src/command-sources/*-source.ts`.
- Keep runtime warning prefixes exactly `[command-inject]` and `[command-sources]`; tests in `src/plugin.test.ts`, `src/plugin/command-inject.test.ts`, and `src/command-sources/aggregator.test.ts` assert these behaviors.
- Keep canonical fallback behavior intact for customized command-name collisions; see `src/command-sources/aggregator.ts` and `src/plugin/command-inject.ts` plus the `TEST-04` cases in `src/command-sources/aggregator.test.ts` and `src/plugin/command-inject.test.ts`.
- Keep discovery/root priority and namespace behavior stable in `src/skills/discovery.ts`, with expectations documented in `src/skills/discovery.test.ts`.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- `index.ts` is a thin package entry that re-exports the plugin factory from `src/plugin.ts`.
- `src/plugin.ts` orchestrates config loading, optional skill discovery, manual/discovered skill merging, and hook construction.
- `src/plugin/command-inject.ts` is the runtime composition layer that instantiates enabled sources, aggregates commands, resolves collisions, mutates OpenCode config, and expands command templates at execution time.
## Layers
- Purpose: Expose the public plugin API consumed by OpenCode.
- Location: `index.ts`
- Contains: Re-exports for `CommandInjectPlugin`, `createCommandInjectPlugin`, and `CommandInjectPluginOptions`.
- Depends on: `src/plugin.ts`
- Used by: Package consumers through the `module` entry in `package.json`.
- Purpose: Build plugin instances and decide which runtime inputs should feed command injection.
- Location: `src/plugin.ts`
- Contains: `createCommandInjectPlugin()`, `mergeSkillInputs()`, and the default `CommandInjectPlugin` export.
- Depends on: `src/config/index.ts`, `src/skills/discovery.ts`, `src/skills/normalize-skill-name.ts`, `src/plugin/command-inject.ts`.
- Used by: `index.ts` and tests in `src/plugin.test.ts`.
- Purpose: Translate loaded inputs into OpenCode hooks.
- Location: `src/plugin/command-inject.ts`
- Contains: `createCommandInjectHooks()` plus collision resolution for dynamic commands against existing commands and config commands.
- Depends on: `src/command-sources/index.ts`, `src/command-sources/template.ts`, `src/config/types.ts`.
- Used by: `src/plugin.ts` and tests in `src/plugin/command-inject.test.ts`.
- Purpose: Provide a uniform interface for each command-producing source.
- Location: `src/command-sources/`
- Contains: `CommandSource` contract in `src/command-sources/types.ts`, source implementations in `src/command-sources/makefile-source.ts`, `src/command-sources/npm-scripts-source.ts`, and `src/command-sources/skill-source.ts`, plus helpers like `src/command-sources/aggregator.ts`, `src/command-sources/command-name-prefix.ts`, `src/command-sources/template.ts`, `src/command-sources/npm-scripts-runner.ts`, `src/command-sources/makefile-parser.ts`, and `src/command-sources/variable-substitution.ts`.
- Depends on: Node filesystem/path APIs, config types, and skill helpers.
- Used by: `src/plugin/command-inject.ts`.
- Purpose: Load, validate, and merge plugin configuration from env-selected, user-level, and project-level files.
- Location: `src/config/`
- Contains: Loader in `src/config/loader.ts`, schema in `src/config/schema.ts`, comment stripping in `src/config/strip-json-comments.ts`, and shared TS types in `src/config/types.ts`.
- Depends on: `zod`, Node filesystem/path APIs.
- Used by: `src/plugin.ts`, schema generation in `scripts/generate-schema.ts`, and tests in `src/config/*.test.ts`.
- Purpose: Walk skill roots, parse `SKILL.md`, namespace discovered skills, and normalize names before injection.
- Location: `src/skills/`
- Contains: Discovery in `src/skills/discovery.ts`, file loading in `src/skills/load-skill.ts`, frontmatter parsing in `src/skills/frontmatter.ts`, naming helpers in `src/skills/normalize-skill-name.ts`, and types in `src/skills/types.ts`.
- Depends on: Node filesystem/path APIs and `src/command-sources/errors.ts`.
- Used by: `src/plugin.ts` and `src/command-sources/skill-source.ts`.
## Data Flow
- Runtime state is ephemeral and function-scoped. `src/plugin/command-inject.ts` keeps `catalog` and `injectedNames` in closure state per plugin instance instead of using global state.
- Configuration is recomputed at plugin initialization via `src/config/loader.ts`; no persistent cache exists inside `src/`.
- Command ordering is preserved by insertion order in `src/command-sources/aggregator.ts` and by source instantiation order in `src/plugin/command-inject.ts`.
## Key Abstractions
- Purpose: Produce OpenCode-compatible plugin instances with optional manual skill injection.
- Examples: `src/plugin.ts`, `index.ts`
- Pattern: Factory function returning async plugin hooks.
- Purpose: Standardize how heterogeneous sources load commands.
- Examples: `src/command-sources/types.ts`, `src/command-sources/makefile-source.ts`, `src/command-sources/npm-scripts-source.ts`, `src/command-sources/skill-source.ts`
- Pattern: Interface + concrete adapters.
- Purpose: Canonical runtime record for an injectable command, including name, description, template, source, and fallback naming metadata.
- Examples: `src/command-sources/types.ts`, `src/plugin/command-inject.ts`, `src/command-sources/aggregator.ts`
- Pattern: Plain data object passed through the pipeline.
- Purpose: Carry source toggles, prompt overrides, and command prefix options through all loading stages.
- Examples: `src/config/types.ts`, `src/config/schema.ts`, `src/config/loader.ts`
- Pattern: Schema-validated config object with layered merge.
- Purpose: Separate skill discovery payloads from the narrower command-source input consumed during injection.
- Examples: `src/skills/types.ts`, `src/plugin.ts`, `src/command-sources/types.ts`
- Pattern: Boundary DTOs between discovery/orchestration/source layers.
## Entry Points
- Location: `index.ts`
- Triggers: Package import by OpenCode or tests.
- Responsibilities: Re-export public plugin symbols only.
- Location: `src/plugin.ts`
- Triggers: `CommandInjectPlugin` initialization inside OpenCode.
- Responsibilities: Load config, optionally discover skills, merge manual/discovered skill inputs, and build hooks.
- Location: `src/plugin/command-inject.ts`
- Triggers: Plugin constructor calling `createCommandInjectHooks()`.
- Responsibilities: Build enabled dynamic sources, aggregate commands, resolve collisions, inject `config.command`, and intercept command execution.
- Location: `scripts/generate-schema.ts`
- Triggers: `bun run generate-schema` from `package.json` and CI in `.github/workflows/test.yml`.
- Responsibilities: Convert `CommandInjectConfigSchema` from `src/config/schema.ts` into `opencode-command-inject.schema.json`.
## Error Handling
- Missing optional inputs return empty results instead of throwing: `src/command-sources/makefile-source.ts`, `src/command-sources/npm-scripts-source.ts`, and `src/skills/load-skill.ts` all treat `ENOENT` as non-fatal.
- Invalid config is logged and replaced with `{}` in `src/config/loader.ts`; invalid project/user config does not abort plugin creation.
- Skill discovery logs warnings per unreadable directory or failed skill load in `src/skills/discovery.ts` and continues scanning remaining roots.
- Collision handling is explicit and non-destructive in `src/command-sources/aggregator.ts` and `src/plugin/command-inject.ts`: canonical fallback is attempted first, then existing commands are preserved.
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
