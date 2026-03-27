# Coding Conventions

**Analysis Date:** 2026-03-26

## Naming Patterns

**Files:**
- Use kebab-case for source and test files in `src/`, such as `src/command-sources/makefile-source.ts`, `src/skills/normalize-skill-name.ts`, and `src/plugin/command-inject.test.ts`.
- Use uppercase fixed names only for convention-driven files outside `src/`, such as `AGENTS.md` and `README.md`.

**Functions:**
- Use camelCase for functions and helpers, such as `mergeSkillInputs` in `src/plugin.ts`, `loadPluginConfig` in `src/config/loader.ts`, and `detectNpmScriptsRunner` in `src/command-sources/npm-scripts-runner.ts`.
- Exported helpers usually declare explicit return types, for example `createCommandInjectHooks(...): Promise<Partial<Hooks>>` in `src/plugin/command-inject.ts` and `withTempDir(...): Promise<void>` in `src/test-utils/temp-dir.ts`.

**Variables:**
- Use camelCase for local variables, including descriptive path names such as `makefilePath` in `src/command-sources/makefile-source.ts`, `packageJsonPath` in `src/command-sources/npm-scripts-source.ts`, and `projectConfigBasePath` in `src/config/loader.ts`.
- Use `UPPER_SNAKE_CASE` only for true constants, such as `CONFIG_FILE_NAME` and `ENV_CONFIG_PATH` in `src/config/loader.ts` and `SHELL_TEMPLATE_PREFIX` in `src/command-sources/template.ts`.

**Types:**
- Use PascalCase for interfaces and type aliases, such as `CommandInfo` in `src/command-sources/types.ts`, `CommandInjectConfig` in `src/config/types.ts`, and `LoadedSkillDefinition` in `src/skills/types.ts`.
- Keep simple shared types in nearby `types.ts` files, then re-export through barrel files like `src/command-sources/index.ts` and `src/config/index.ts`.

## Code Style

**Formatting:**
- Follow the repository’s TypeScript style visible in `src/plugin.ts`, `src/plugin/command-inject.ts`, and `src/skills/discovery.ts`:
  - 2-space indentation
  - double quotes
  - no semicolons
  - trailing commas are used sparingly and only when already present in multiline literals
- Favor multiline wrapping for long conditions and argument lists, as in `src/plugin/command-inject.ts` lines 37-43 and `src/config/loader.ts` lines 71-76.

**Linting:**
- Use ESLint from `eslint.config.js`.
- Repository-wide ignores: `.opencode/**` and `**/*.js` in `eslint.config.js`.
- Type-aware linting applies to `src/**/*.ts` via `parserOptions.project` in `eslint.config.js`.
- Enforced rules visible in config:
  - `@typescript-eslint/no-explicit-any: "error"`
  - `no-undef: "off"`
  - `no-console: "off"`
- There is one explicit local suppression in `src/plugin/command-inject.ts` for `output.parts.unshift(... as any)`. Treat this as an exception, not a general pattern.

## Import Organization

**Order:**
1. Node built-ins, usually with `node:` prefixes, for example `import { readFile } from "node:fs/promises"` in `src/command-sources/makefile-source.ts`
2. Internal value imports, for example `import { parseMakefile } from "./makefile-parser"` in `src/command-sources/makefile-source.ts`
3. Type-only imports last, using `import type`, for example `import type { CommandInfo, CommandSource, LoadContext, SourceConfig } from "./types"` in `src/command-sources/makefile-source.ts`

**Path Aliases:**
- No path aliases are configured in `tsconfig.json`; use relative imports like `./types`, `../config`, and `./plugin/command-inject`.

## Error Handling

**Patterns:**
- Treat missing optional files as non-fatal and return safe defaults. Examples:
  - `src/command-sources/makefile-source.ts` returns `[]` when `Makefile` is absent.
  - `src/command-sources/npm-scripts-source.ts` returns `[]` when `package.json` is absent or invalid.
  - `src/skills/load-skill.ts` returns `null` when `SKILL.md` is absent or blank.
- Narrow filesystem errors with `isErrnoException` from `src/command-sources/errors.ts` before checking `error.code`.
- Prefer logging plus fallback behavior over throwing for recoverable cases, as in `src/config/loader.ts` and `src/skills/discovery.ts`.

## Logging

**Framework:** console or injected logger

**Patterns:**
- Source-loading code logs through injected `warn` functions, not direct `console.warn`, for example `ctx.logger.warn(...)` in `src/command-sources/makefile-source.ts`, `src/command-sources/npm-scripts-source.ts`, and `src/command-sources/skill-source.ts`.
- Top-level config/plugin code uses `console.warn(...)` with consistent prefixes in `src/config/loader.ts` and `src/plugin.ts`.
- Keep message prefixes stable:
  - `[command-sources] ...` in `src/command-sources/aggregator.ts` and related loaders
  - `[command-inject] ...` in `src/config/loader.ts`, `src/plugin.ts`, and `src/skills/discovery.ts`

## Comments

**When to Comment:**
- Keep comments minimal and use them only where behavior is not obvious.
- Existing comments mostly explain edge cases or test intent, such as namespace rules in `src/skills/discovery.ts` and behavior-focused notes in `src/plugin/command-inject.test.ts`.

**JSDoc/TSDoc:**
- Not used in the production code inspected under `src/`. Prefer clear names and types over block documentation.

## Function Design

**Size:**
- Prefer small focused helpers and single-purpose methods. Good reference points:
  - `buildShellTemplate` and `injectCommandArguments` in `src/command-sources/template.ts`
  - `loadConfigFromPath` and `deepMerge` in `src/config/loader.ts`
  - `applyNamespace` in `src/skills/discovery.ts`

**Parameters:**
- Pass structured option objects when a function has several related inputs, such as `CommandInjectOptions` in `src/plugin/command-inject.ts`, `DiscoveryOptions` in `src/skills/types.ts`, and `LoadContext` in `src/command-sources/types.ts`.
- Use optional config objects for extensibility, such as `SourceConfig` in `src/config/types.ts`.

**Return Values:**
- Use explicit safe return shapes instead of exceptions for routine absence or parse failures:
  - arrays for collections in `src/command-sources/*.ts`
  - `null` for optional object loading in `src/skills/load-skill.ts`
  - discriminated status objects in `src/config/loader.ts`

## Module Design

**Exports:**
- Prefer named exports throughout the codebase. No default exports appear in `src/`.
- Public module surfaces are collected in barrel files like `src/command-sources/index.ts` and `src/config/index.ts`.

**Barrel Files:**
- Use barrel files selectively for feature entry points. Current examples:
  - `src/command-sources/index.ts`
  - `src/config/index.ts`
- Import directly from implementation files when the caller is inside the same feature area, such as `src/plugin.ts` importing `./plugin/command-inject`.

---

*Convention analysis: 2026-03-26*
