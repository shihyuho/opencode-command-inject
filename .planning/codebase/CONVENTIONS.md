# Coding Conventions

**Analysis Date:** 2026-03-30

## Naming Patterns

**Files:**
- Use kebab-case for implementation and test files in `src/`, such as `src/command-sources/npm-scripts-source.ts`, `src/config/strip-json-comments.ts`, and `src/plugin/command-inject.test.ts`.
- Keep related tests co-located with implementation using the same basename plus `.test.ts`, such as `src/config/schema.ts` + `src/config/schema.test.ts` and `src/skills/discovery.ts` + `src/skills/discovery.test.ts`.

**Functions:**
- Use camelCase for functions and helpers, such as `createCommandInjectPlugin` in `src/plugin.ts`, `buildCommandName` in `src/command-sources/command-name-prefix.ts`, and `loadPluginConfig` in `src/config/loader.ts`.
- Use verb-first names for behavior and boolean-style names for control flags, such as `mergeSkillInputs`, `resolveDynamicCommandCollisions`, `getEnvConfigPath`, and `shouldDiscover` in `src/plugin.ts` / `src/config/loader.ts`.

**Variables:**
- Use camelCase for locals and params, including descriptive intermediate names like `existingResolvedDynamicCommands` in `src/plugin/command-inject.ts` and `sourceCommandNamePrefix` in `src/command-sources/command-name-prefix.ts`.
- Reserve UPPER_SNAKE_CASE for module constants, such as `ENV_CONFIG_PATH` and `CONFIG_FILE_NAME` in `src/config/loader.ts` and `SKILL_PREFIX` in `src/skills/discovery.ts`.

**Types:**
- Use PascalCase for interfaces and exported types, such as `CommandInjectConfig` in `src/config/types.ts`, `CommandInfo` in `src/command-sources/types.ts`, and `LoadedSkillDefinition` in `src/skills/types.ts`.
- Prefer `interface` for object shapes and `type` for unions/aliases, such as `PackageManager` in `src/command-sources/npm-scripts-runner.ts`.

## Code Style

**Formatting:**
- No formatter config is detected. Match the existing style in `src/**/*.ts`: two-space indentation, semicolon-free statements, double quotes, and trailing commas only where TypeScript syntax naturally keeps them.
- Keep short guard clauses and early returns, as seen in `src/config/loader.ts`, `src/skills/load-skill.ts`, and `src/command-sources/skill-source.ts`.

**Linting:**
- ESLint is configured in `eslint.config.js` with `@eslint/js` and `@typescript-eslint` for `src/**/*.ts`.
- Follow repo lint rules from `eslint.config.js`: `@typescript-eslint/no-explicit-any` is an error, `no-undef` is off, and `no-console` is off.
- Treat the single `any` exception in `src/plugin/command-inject.ts` line 194 as a narrowly-scoped escape hatch; if another escape is required, isolate it and document it with an inline disable comment.

## TypeScript Strictness

- `tsconfig.json` enables `strict: true`, `noEmit: true`, `moduleResolution: "Bundler"`, and Bun/Vitest types.
- Use explicit return types on exported functions and methods, such as `loadPluginConfig(...): Promise<CommandInjectConfig>` in `src/config/loader.ts` and `load(...): Promise<CommandInfo[]>` in source classes under `src/command-sources/`.
- Prefer `import type` for type-only imports, as seen in `src/plugin.ts`, `src/plugin/command-inject.ts`, and `src/command-sources/skill-source.ts`.

## Import Organization

**Order:**
1. Node built-ins, such as `node:path` and `node:fs/promises` in `src/config/loader.ts` and `src/command-sources/npm-scripts-source.ts`
2. External packages, such as `@opencode-ai/plugin` in `src/plugin.ts` and `zod` in `src/config/schema.ts`
3. Local relative imports, with `import type` used where possible

**Path Aliases:**
- No path aliases are configured in `tsconfig.json`. Use relative imports like `./config`, `../command-sources`, and `./skills/discovery`.

## Error Handling

**Patterns:**
- Prefer recoverable failures with warnings instead of throwing for optional inputs and discovery/config paths. Examples: `src/config/loader.ts`, `src/command-sources/makefile-source.ts`, `src/command-sources/npm-scripts-source.ts`, and `src/skills/discovery.ts`.
- Use `safeParse` for user config validation in `src/config/schema.ts` + `src/config/loader.ts` instead of throwing parse errors into runtime flow.
- Branch on `ENOENT` explicitly for optional files/directories, using `isErrnoException` in `src/command-sources/errors.ts` and direct errno checks in `src/config/loader.ts` / `src/skills/load-skill.ts`.
- Preserve existing behavior on collisions and duplicates by warning and keeping the existing/manual/first command rather than overwriting it. This rule is implemented in `src/plugin.ts`, `src/plugin/command-inject.ts`, and `src/command-sources/aggregator.ts`.

## Logging

**Framework:** console

**Patterns:**
- Route runtime warnings through `logger.warn(...)` where a logger is available, then back it with `console.warn` at plugin boundary in `src/plugin.ts`.
- Keep warning prefixes stable: use `[command-inject]` for plugin/config/injection warnings in `src/plugin.ts`, `src/plugin/command-inject.ts`, and `src/config/loader.ts`; use `[command-sources]` for source aggregation/loading warnings in `src/command-sources/aggregator.ts`, `src/command-sources/makefile-source.ts`, `src/command-sources/npm-scripts-source.ts`, and `src/command-sources/skill-source.ts`.
- Use `logger.debug?.(...)` only for optional lower-severity tracing, as in duplicate discovered skill handling in `src/skills/discovery.ts`.

## Comments

**When to Comment:**
- Most code is self-descriptive and comment-light.
- Add comments only when documenting non-obvious edge cases or fallback behavior, such as namespacing notes in `src/skills/discovery.ts` and collision/fallback intent in tests like `src/plugin/command-inject.test.ts`.

**JSDoc/TSDoc:**
- Not used. Follow the existing pattern of expressive names plus focused inline comments instead of block docs.

## Function Design

**Size:**
- Keep helpers small and focused where possible, such as `buildSkillTemplate` in `src/skills/load-skill.ts`, `getEnvConfigPath` in `src/config/loader.ts`, and `injectCommandArguments` in `src/command-sources/template.ts`.
- Larger orchestrators may stay in one file when they centralize policy, such as `createCommandInjectHooks` in `src/plugin/command-inject.ts` and `discoverSkills` in `src/skills/discovery.ts`.

**Parameters:**
- Prefer a single options object for exported orchestration APIs, such as `createCommandInjectPlugin(options)` in `src/plugin.ts`, `buildCommandName({...})` in `src/command-sources/command-name-prefix.ts`, and `discoverSkills(options)` in `src/skills/discovery.ts`.
- Use constructor injection for per-source config, as in `src/command-sources/makefile-source.ts`, `src/command-sources/npm-scripts-source.ts`, and `src/command-sources/skill-source.ts`.

**Return Values:**
- Return empty collections or `{}` for recoverable missing state instead of null-heavy APIs, such as `loadPluginConfig` in `src/config/loader.ts` and `load()` methods in `src/command-sources/*-source.ts`.
- Use `null` only when absence is semantically meaningful, such as `loadSkill(...): Promise<LoadedSkillDefinition | null>` in `src/skills/load-skill.ts`.

## Module Design

**Exports:**
- Prefer named exports from implementation files, such as `CommandInjectPlugin` and `createCommandInjectPlugin` in `src/plugin.ts`.
- Re-export public config and command-source surface from index files like `index.ts`, `src/config/index.ts`, and `src/command-sources/index.ts`.

**Barrel Files:**
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

---

*Convention analysis: 2026-03-30*
