# Codebase Structure

**Analysis Date:** 2026-03-26

## Directory Layout

```text
opencode-command-inject/
├── index.ts                         # Package entry that re-exports plugin API
├── src/                             # Runtime implementation and tests
│   ├── command-sources/             # Source adapters for Makefile, npm scripts, and skills
│   ├── config/                      # Config types, schema, loader, and JSONC utilities
│   ├── plugin/                      # OpenCode hook construction
│   ├── skills/                      # Skill discovery, loading, and normalization
│   ├── test-utils/                  # Shared temporary filesystem helpers for tests
│   ├── plugin.ts                    # Plugin factory/orchestration entry
│   └── plugin.test.ts               # Integration-style tests for plugin startup behavior
├── scripts/                         # Repository maintenance scripts
├── .github/workflows/               # CI and release automation
├── opencode-command-inject.schema.json # Generated JSON schema published with package
├── package.json                     # Manifest, scripts, and dependency declarations
└── .planning/codebase/              # Generated repository analysis documents
```

## Directory Purposes

**`src/command-sources/`:**
- Purpose: Put every command-provider implementation and its supporting helpers here.
- Contains: `CommandSource` implementations, parser/helpers, deduplication logic, source-local tests.
- Key files: `src/command-sources/types.ts`, `src/command-sources/aggregator.ts`, `src/command-sources/makefile-source.ts`, `src/command-sources/npm-scripts-source.ts`, `src/command-sources/skill-source.ts`, `src/command-sources/template.ts`

**`src/config/`:**
- Purpose: Keep config parsing and validation separate from plugin logic.
- Contains: Runtime config loader, schema/type definitions, JSON comment stripping utility, tests.
- Key files: `src/config/loader.ts`, `src/config/schema.ts`, `src/config/types.ts`, `src/config/index.ts`

**`src/plugin/`:**
- Purpose: Hold the OpenCode-specific hook assembly logic.
- Contains: The hook builder plus its tests.
- Key files: `src/plugin/command-inject.ts`, `src/plugin/command-inject.test.ts`

**`src/skills/`:**
- Purpose: Isolate discovery of local skills from command-source code.
- Contains: Skill root resolution, recursive directory scanning, `SKILL.md` loading, frontmatter parsing, name normalization, tests.
- Key files: `src/skills/discovery.ts`, `src/skills/load-skill.ts`, `src/skills/frontmatter.ts`, `src/skills/normalize-skill-name.ts`, `src/skills/types.ts`

**`src/test-utils/`:**
- Purpose: Reuse filesystem setup/teardown helpers across tests.
- Contains: Temp directory creation, recursive mkdir, text file writing.
- Key files: `src/test-utils/temp-dir.ts`

**`scripts/`:**
- Purpose: Keep repository maintenance utilities outside runtime code.
- Contains: Schema generation script.
- Key files: `scripts/generate-schema.ts`

**`.github/workflows/`:**
- Purpose: Define CI validation and release automation.
- Contains: Test workflow plus npm/release-please workflows.
- Key files: `.github/workflows/test.yml`, `.github/workflows/release-npm.yml`, `.github/workflows/release-please.yml`

## Key File Locations

**Entry Points:**
- `index.ts`: Published package entry that re-exports the plugin interface.
- `src/plugin.ts`: Main runtime entry for plugin initialization.
- `src/plugin/command-inject.ts`: Hook builder entry used after config/discovery are complete.
- `scripts/generate-schema.ts`: Tooling entry for schema regeneration.

**Configuration:**
- `package.json`: Package metadata, Bun scripts, dependency list, publish file list.
- `tsconfig.json`: TypeScript compiler settings.
- `eslint.config.js`: ESLint setup.
- `src/config/schema.ts`: Source of truth for runtime config structure.
- `src/config/loader.ts`: Loads env, user, and project config files.
- `opencode-command-inject.schema.json`: Generated schema artifact shipped with the package.

**Core Logic:**
- `src/plugin.ts`: Startup orchestration.
- `src/plugin/command-inject.ts`: Dynamic command catalog assembly and hook behavior.
- `src/command-sources/aggregator.ts`: Multi-source merge and deduplication.
- `src/command-sources/makefile-source.ts`: `Makefile` adapter.
- `src/command-sources/npm-scripts-source.ts`: `package.json` scripts adapter.
- `src/command-sources/skill-source.ts`: Loaded-skill adapter.
- `src/skills/discovery.ts`: Filesystem scan for local skills.

**Testing:**
- `src/plugin.test.ts`: Plugin-level integration tests.
- `src/plugin/command-inject.test.ts`: Hook behavior tests.
- `src/command-sources/*.test.ts`: Source and parser tests.
- `src/config/*.test.ts`: Config loader/schema utility tests.
- `src/skills/*.test.ts`: Skill discovery and parsing tests.
- `src/test-utils/temp-dir.ts`: Shared helpers used by the test files above.

## Naming Conventions

**Files:**
- Runtime source files use kebab-case: `src/command-sources/npm-scripts-source.ts`, `src/skills/normalize-skill-name.ts`
- Barrel/index files are named `index.ts`: `index.ts`, `src/config/index.ts`, `src/command-sources/index.ts`
- Tests mirror their target file with `.test.ts`: `src/plugin/command-inject.test.ts`, `src/config/loader.test.ts`

**Directories:**
- Top-level runtime directories are noun-based and responsibility-based: `src/command-sources/`, `src/config/`, `src/plugin/`, `src/skills/`, `src/test-utils/`
- Place tests next to the module family they verify rather than under a separate top-level `tests/` directory.

## Where to Add New Code

**New Feature:**
- Primary code: add orchestration changes to `src/plugin.ts` only if the feature changes startup/plugin behavior; otherwise prefer the nearest focused module under `src/command-sources/`, `src/config/`, or `src/skills/`.
- Tests: add matching `*.test.ts` beside the affected module family, for example `src/command-sources/<feature>.test.ts` or `src/skills/<feature>.test.ts`.

**New Component/Module:**
- New command source implementation: add `src/command-sources/<source-name>.ts`, export it from `src/command-sources/index.ts`, and wire it in `src/plugin/command-inject.ts`.
- New config-related module: add it under `src/config/` and re-export from `src/config/index.ts` if it becomes public within the package.
- New skill-discovery helper: add it under `src/skills/` and keep skill-specific naming/normalization logic there, not in `src/plugin.ts`.

**Utilities:**
- Shared command templating or source helpers: place in `src/command-sources/` if only command adapters use them, as done with `src/command-sources/template.ts` and `src/command-sources/errors.ts`.
- Shared test-only helpers: place in `src/test-utils/` as done with `src/test-utils/temp-dir.ts`.
- Build/release utilities: place in `scripts/` if they are only run from package scripts or CI.

## Special Directories

**`.planning/codebase/`:**
- Purpose: Store generated architecture/quality/stack mapping documents for later planning/execution workflows.
- Generated: Yes
- Committed: Intended to be committed when repository mapping is updated

**`.github/workflows/`:**
- Purpose: CI validation and release publishing.
- Generated: No
- Committed: Yes

**`scripts/`:**
- Purpose: Repository maintenance commands such as schema generation.
- Generated: No
- Committed: Yes

**`src/test-utils/`:**
- Purpose: Non-runtime helpers used only by tests.
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-03-26*
