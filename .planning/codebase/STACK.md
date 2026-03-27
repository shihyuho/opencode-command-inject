# Technology Stack

**Analysis Date:** 2026-03-26

## Languages

**Primary:**
- TypeScript (ESM) - plugin source and tests in `index.ts`, `src/**/*.ts`, and `scripts/generate-schema.ts`

**Secondary:**
- JavaScript - ESLint flat config in `eslint.config.js`
- JSON / JSON Schema - package and release metadata in `package.json`, `release-please-config.json`, `.release-please-manifest.json`, `skills-lock.json`, and `opencode-command-inject.schema.json`
- YAML - CI/CD workflows in `.github/workflows/test.yml`, `.github/workflows/release-please.yml`, and `.github/workflows/release-npm.yml`
- Markdown - user and config docs in `README.md` and `docs/configuration.md`

## Runtime

**Environment:**
- Bun runtime/tooling for local development and script execution, defined in `package.json` scripts and used by `.github/workflows/test.yml`
- Node.js runtime compatibility for publishing, with Node 24 set in `.github/workflows/release-npm.yml`

**Package Manager:**
- Bun - primary package manager for this repository via `bun.lock` and `package.json`
- Lockfile: present in `bun.lock`

## Frameworks

**Core:**
- `@opencode-ai/plugin` - OpenCode plugin API used by `src/plugin.ts` and `src/plugin/command-inject.ts` to register hooks and inject commands
- `zod` - runtime config validation in `src/config/schema.ts`

**Testing:**
- Vitest - test runner configured via `package.json` and exercised by `src/**/*.test.ts`

**Build/Dev:**
- TypeScript (`tsc --noEmit`) - strict type-checking configured in `tsconfig.json`
- ESLint flat config - linting in `eslint.config.js`
- `zod-to-json-schema` - schema generation in `scripts/generate-schema.ts`
- Release Please - automated versioning configured in `release-please-config.json` and `.github/workflows/release-please.yml`

## Key Dependencies

**Critical:**
- `@opencode-ai/plugin` (`^1.2.15`) - defines the plugin contract consumed by `src/plugin.ts` and `src/plugin/command-inject.ts`
- `zod` (`^3.25.0`) - validates user/project config structures in `src/config/schema.ts` before merge/use in `src/config/loader.ts`

**Infrastructure:**
- `@opencode-ai/sdk` (`^1.2.15`) - development dependency for OpenCode ecosystem compatibility, declared in `package.json`
- `typescript` (`^5.7.3`) - compiler/type system for `src/**/*.ts`
- `vitest` (`^3.2.4`) - automated tests for plugin, config, skills, and command sources in `src/**/*.test.ts`
- `eslint`, `@eslint/js`, `@typescript-eslint/*` - lint pipeline defined in `eslint.config.js`
- `zod-to-json-schema` (`3.24.1`) - emits `opencode-command-inject.schema.json` from `src/config/schema.ts`

## Configuration

**Environment:**
- Optional override: `OPENCODE_COMMAND_INJECT_CONFIG` selects a single config file path in `src/config/loader.ts` and `docs/configuration.md`
- Optional config-root override: `XDG_CONFIG_HOME` changes user config lookup in `src/config/loader.ts`
- Project config path: `.opencode/opencode-command-inject.jsonc` or `.opencode/opencode-command-inject.json`, documented in `docs/configuration.md`
- User config path: `~/.config/opencode/opencode-command-inject.jsonc` or `.json`, documented in `docs/configuration.md`

**Build:**
- TypeScript compiler options in `tsconfig.json`
- Lint rules in `eslint.config.js`
- Package entry/export metadata in `package.json`
- Generated schema artifact in `opencode-command-inject.schema.json`
- Release automation in `release-please-config.json` and `.github/workflows/release-please.yml`
- npm publish automation in `.github/workflows/release-npm.yml`

## Platform Requirements

**Development:**
- Bun installed to run `bun install`, `bun run typecheck`, `bun run lint`, `bun run test`, and `bun run generate-schema` from `package.json`
- OpenCode CLI/plugin host available for real plugin usage, referenced in `README.md`
- File system access to project roots and skill directories because sources read `Makefile`, `package.json`, and `SKILL.md` files in `src/command-sources/*.ts` and `src/skills/*.ts`

**Production:**
- Distributed as an npm package for OpenCode plugin loading, with package entry `index.ts` in `package.json`
- Published to npm registry through `.github/workflows/release-npm.yml`
- Consumed by OpenCode through config references shown in `README.md`

---

*Stack analysis: 2026-03-26*
