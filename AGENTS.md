# AGENTS.md

Guidance for coding agents working in `opencode-commands-wire`.

## Project Overview

- Language: TypeScript (ESM)
- Package manager: npm
- Test framework: Vitest
- Linting: ESLint (`@eslint/js` + `@typescript-eslint`)
- Type checking: `tsc` in strict mode
- Build output: bundled ESM plugin JS under `.opencode/plugins/`

## Rule Sources Checked

The following rule sources were checked in this repository:

- `.cursor/rules/` -> not present
- `.cursorrules` -> not present
- `.github/copilot-instructions.md` -> not present

If these files are added later, treat them as higher-priority constraints.

## Canonical Commands

Use npm scripts as the first choice.

```bash
# Build bundle for plugin runtime
npm run build

# Lint all TypeScript sources
npm run lint

# Type-check without emitting files
npm run typecheck

# Run all tests once
npm run test
```

Current script definitions (from `package.json`):

- `build`: `npx --yes esbuild src/index.ts --bundle --platform=node --format=esm --outfile=.opencode/plugins/commands-wire.js`
- `lint`: `eslint .`
- `typecheck`: `tsc --noEmit`
- `test`: `vitest run`

## Single-Test Commands (Vitest)

Run one test file:

```bash
npm run test -- src/features/command-sources/npm-source.test.ts
```

Run one test file directly with Vitest:

```bash
npx vitest run src/features/command-sources/npm-source.test.ts
```

Run a single test case by name:

```bash
npx vitest run src/features/command-sources/npm-source.test.ts -t "maps scripts to npm commands"
```

Useful test file targets:

- `src/features/command-sources/aggregator.test.ts`
- `src/features/command-sources/makefile-parser.test.ts`
- `src/features/command-sources/makefile-source.test.ts`
- `src/features/command-sources/npm-source.test.ts`
- `src/hooks/commands-wire/executor.test.ts`

## Expected Agent Workflow

For code changes, follow this sequence:

1. Read nearby files and match existing patterns.
2. Implement minimal, scoped edits.
3. Run targeted tests first (single-file or `-t` where possible).
4. Run `npm run typecheck`.
5. Run `npm run lint`.
6. Run `npm run test` when behavior changes are broad.

Do not refactor unrelated code during a bug fix.

## Code Style Guidelines

### Imports

- Use ESM `import`/`export` syntax only.
- Prefer `node:` prefixes for Node built-ins.
  - Example: `import { readFile } from "node:fs/promises"`
- Use `import type` for type-only imports.
- Keep imports explicit and local; avoid wildcard imports.
- Use relative paths used by surrounding files (no path aliases currently configured).
- Omit `.ts` extensions in import paths.

### Formatting

- Use double quotes for strings.
- Do not use semicolons.
- Use 2-space indentation.
- Keep lines readable; wrap long calls across multiple lines.
- Follow existing object/array literal wrapping style in nearby code.
- Avoid adding comments unless behavior is non-obvious.

### Types and Type Safety

- Preserve `strict` TypeScript compatibility.
- Do not use `any` (`@typescript-eslint/no-explicit-any` is enforced).
- Avoid `@ts-ignore` and `@ts-expect-error`.
- Prefer narrow interfaces and explicit return types for exported APIs.
- For uncertain JSON structures, use safe narrowing (for example `Record<string, unknown>` + checks).
- Keep public types in feature `types.ts` modules when applicable.

### Naming Conventions

- File names: kebab-case (`makefile-source.ts`).
- Classes/interfaces/types: PascalCase (`NpmScriptsCommandSource`, `CommandInfo`).
- Variables/functions/methods: camelCase (`buildCommandCatalog`, `existingCommands`).
- Constants: camelCase unless true global constants require ALL_CAPS.
- Test files: mirror source name with `.test.ts` suffix.

### Error Handling and Logging

- Wrap filesystem and parse operations in `try/catch`.
- Treat expected missing-file cases (for example `ENOENT`) as non-fatal when feature logic expects optional files.
- Return safe defaults (`[]`) rather than throwing for recoverable source-loading failures.
- Emit warnings via provided logger (`ctx.logger.warn` / `options.logger.warn`).
- Use consistent log prefixes already used in the repo:
  - `[command-sources] ...`
  - `[commands-wire] ...`

### Testing Patterns

- Use Vitest primitives: `describe`, `it`, `expect`, `vi`.
- Keep tests behavior-focused and deterministic.
- Use temp directory helpers from `src/test-utils/temp-dir.ts` for filesystem scenarios.
- Assert both returned values and warning calls when error paths are expected.
- Prefer small, focused test cases over large end-to-end style tests.

## Build Artifact Expectations

- Build should produce one bundled file:
  - `.opencode/plugins/commands-wire.js`
- Do not commit generated output unless explicitly requested.

## Scope and Safety Rules for Agents

- Make the smallest change that solves the requested problem.
- Do not introduce new dependencies without clear need.
- Do not modify unrelated files.
- Do not run destructive git commands.
- Do not commit or push unless explicitly asked.

## Quick Pre-PR Checklist

- Relevant tests pass (single-file and/or full suite as needed).
- `npm run typecheck` passes.
- `npm run lint` passes.
- `npm run build` succeeds and output path is correct.
- Changes align with naming and error-handling patterns in `src/features/command-sources` and `src/hooks/commands-wire`.
