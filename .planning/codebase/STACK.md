# Technology Stack

**Analysis Date:** 2026-03-30

## Languages

**Primary:**
- TypeScript 5.7.x - runtime and plugin implementation in `index.ts`, `src/plugin.ts`, `src/plugin/command-inject.ts`, `src/config/*.ts`, `src/command-sources/*.ts`, `src/skills/*.ts`

**Secondary:**
- JavaScript (ES modules) - lint configuration in `eslint.config.js`
- YAML - CI/CD workflows in `.github/workflows/test.yml`, `.github/workflows/release-please.yml`, `.github/workflows/release-npm.yml`
- JSON / JSON Schema - package metadata in `package.json`, release metadata in `release-please-config.json`, published config schema in `opencode-command-inject.schema.json`
- Markdown - operator docs in `README.md` and `docs/configuration.md`

## Runtime

**Environment:**
- Bun runtime/tooling - scripts in `package.json`, Bun-specific typings in `tsconfig.json`, CI setup in `.github/workflows/test.yml`
- Node.js 24 - npm publish workflow in `.github/workflows/release-npm.yml`
- OpenCode plugin host - plugin entry exported from `index.ts` and `src/plugin.ts` via `@opencode-ai/plugin`

**Package Manager:**
- Bun - install and script runner used by `package.json` scripts and GitHub Actions in `.github/workflows/test.yml`
- Lockfile: present (`bun.lock`)

## Frameworks

**Core:**
- `@opencode-ai/plugin` ^1.2.15 - OpenCode plugin API used in `src/plugin.ts` and `src/plugin/command-inject.ts`
- `zod` ^3.25.0 - runtime config validation and schema source in `src/config/schema.ts`

**Testing:**
- Vitest ^3.2.4 - test runner referenced by `package.json` and used by `src/**/*.test.ts`

**Build/Dev:**
- TypeScript ^5.7.3 - static typecheck via `package.json` and `tsconfig.json`
- ESLint 9 + `@typescript-eslint/*` - linting via `eslint.config.js`
- `zod-to-json-schema` 3.24.1 - schema generation in `scripts/generate-schema.ts`

## Key Dependencies

**Critical:**
- `@opencode-ai/plugin` - plugin contract for injecting commands into OpenCode from `src/plugin.ts`
- `zod` - validates config loaded by `src/config/loader.ts` and defines the published schema in `src/config/schema.ts`

**Infrastructure:**
- `@opencode-ai/sdk` - development dependency for OpenCode ecosystem compatibility from `package.json`
- `zod-to-json-schema` - publishes editor-consumable schema artifact from `scripts/generate-schema.ts`
- `@types/bun` - Bun runtime typings enabled in `tsconfig.json`

## Configuration

**Environment:**
- Config path override uses `OPENCODE_COMMAND_INJECT_CONFIG` in `src/config/loader.ts`
- User config base directory uses `XDG_CONFIG_HOME` fallback to `~/.config` in `src/config/loader.ts`
- Supported config files are `.jsonc` and `.json` at `${XDG_CONFIG_HOME}/opencode/opencode-command-inject.*` and `.opencode/opencode-command-inject.*`, documented in `docs/configuration.md`

**Build:**
- Type checking: `package.json` → `bun run typecheck` using `tsconfig.json`
- Linting: `package.json` → `bun run lint` using `eslint.config.js`
- Schema generation: `package.json` → `bun run generate-schema` using `scripts/generate-schema.ts` to refresh `opencode-command-inject.schema.json`
- Test workflow enforces schema freshness in `.github/workflows/test.yml`

## Platform Requirements

**Development:**
- Bun installed locally for `bun install`, `bun run test`, `bun run lint`, `bun run typecheck`, and `bun run generate-schema` from `package.json`
- OpenCode CLI/plugin environment for real plugin usage, documented in `README.md`

**Production:**
- Published as an npm package with plugin entry `index.ts` and packaged files listed in `package.json`
- Release automation uses Release Please in `.github/workflows/release-please.yml` and npm publish with provenance in `.github/workflows/release-npm.yml`

---

*Stack analysis: 2026-03-30*
