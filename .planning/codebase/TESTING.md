# Testing Patterns

**Analysis Date:** 2026-03-26

## Test Framework

**Runner:**
- Vitest `^3.2.4` from `package.json`
- Config: no dedicated `vitest.config.*` file detected; tests rely on defaults plus `vitest/globals` in `tsconfig.json`

**Assertion Library:**
- Vitest `expect` from test files such as `src/plugin.test.ts`, `src/plugin/command-inject.test.ts`, and `src/skills/frontmatter.test.ts`

**Run Commands:**
```bash
bun run test              # Run all tests
bunx vitest run           # Run tests directly with Vitest
bunx vitest run -t "..."  # Run one named test
```

## Test File Organization

**Location:**
- Tests are colocated with implementation under `src/`, for example:
  - `src/plugin.test.ts` for `src/plugin.ts`
  - `src/plugin/command-inject.test.ts` for `src/plugin/command-inject.ts`
  - `src/command-sources/makefile-source.test.ts` for `src/command-sources/makefile-source.ts`
  - `src/skills/discovery.test.ts` for `src/skills/discovery.ts`

**Naming:**
- Mirror the source filename and add `.test.ts`, as seen in `src/config/loader.test.ts`, `src/command-sources/aggregator.test.ts`, and `src/skills/frontmatter.test.ts`.

**Structure:**
```text
src/
├── plugin.test.ts
├── plugin/
│   └── command-inject.test.ts
├── config/
│   ├── loader.test.ts
│   ├── schema.test.ts
│   └── strip-json-comments.test.ts
├── command-sources/
│   ├── aggregator.test.ts
│   ├── makefile-parser.test.ts
│   ├── makefile-source.test.ts
│   ├── npm-scripts-runner.test.ts
│   ├── npm-scripts-source.test.ts
│   └── skill-source.test.ts
└── skills/
    ├── discovery.test.ts
    └── frontmatter.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
describe("createCommandInjectHooks", () => {
  it("injects make and npm commands during startup", async () => {
    await withTempDir(async (dir) => {
      await writeText(join(dir, "Makefile"), "build: ## Build app")
      const hooks = await createCommandInjectHooks({
        projectRoot: dir,
        logger: { warn: vi.fn() },
        existingCommands: [],
      })
      expect(hooks).toHaveProperty("command.execute.before")
    })
  })
})
```
- This pattern is taken directly from `src/plugin/command-inject.test.ts`.

**Patterns:**
- Use nested `describe(...)` blocks for feature subdivisions, such as `src/plugin.test.ts` and `src/command-sources/skill-source.test.ts`.
- Keep one behavior per `it(...)` block with direct assertions on outputs and warnings.
- Prefer inline setup inside each test unless shared lifecycle is necessary; `src/config/loader.test.ts` is the main file using `beforeAll` and `afterAll` for a shared temp directory.

## Mocking

**Framework:** Vitest `vi`

**Patterns:**
```typescript
vi.mock("node:fs/promises", () => {
  return {
    readFile: vi.fn(),
    stat: vi.fn(),
  }
})

const { readFile } = await import("node:fs/promises")
vi.mocked(readFile).mockResolvedValueOnce(JSON.stringify({ packageManager: "pnpm@10.0.0" }))
```
- This pattern comes from `src/command-sources/npm-scripts-runner.test.ts`.

```typescript
vi.mock("./skills/discovery", () => ({ discoverSkills: vi.fn() }))
vi.mock("./config", () => ({ loadPluginConfig: vi.fn() }))
```
- This module-mocking pattern comes from `src/plugin.test.ts`.

**What to Mock:**
- Mock external module boundaries and platform calls, especially filesystem APIs and imported collaborators, as in `src/command-sources/npm-scripts-runner.test.ts` and `src/plugin.test.ts`.
- Mock warning sinks with `vi.fn<(message: string) => void>()` when verifying error or conflict paths, as in `src/command-sources/aggregator.test.ts` and `src/command-sources/skill-source.test.ts`.

**What NOT to Mock:**
- Do not mock simple pure parsing or transformation logic; test it directly with literal inputs, as in `src/command-sources/makefile-parser.test.ts`, `src/config/schema.test.ts`, and `src/skills/frontmatter.test.ts`.
- For filesystem-heavy integration behavior, prefer real temp directories over deep mocking, as in `src/plugin/command-inject.test.ts`, `src/skills/discovery.test.ts`, and `src/command-sources/makefile-source.test.ts`.

## Fixtures and Factories

**Test Data:**
```typescript
await withTempDir(async (dir) => {
  await writeText(join(dir, "package.json"), JSON.stringify({ scripts: { test: "vitest" } }))
  await writeText(join(dir, "bun.lockb"), "")
  const source = new NpmScriptsCommandSource()
  const commands = await source.load({ rootDir: dir, logger: { warn: vi.fn() } })
  expect(commands[0].template).toBe("Use shell to execute `bun run test -- $ARGUMENTS`")
})
```
- This real-fixture pattern is taken from `src/command-sources/npm-scripts-source.test.ts`.

**Location:**
- Shared test helpers live in `src/test-utils/temp-dir.ts`.
- Most fixtures are created inline per test with `withTempDir`, `writeText`, and `mkdir` rather than stored as separate fixture files.

## Coverage

**Requirements:** None enforced in repository config; no coverage script or threshold file was detected in `package.json` or root config files.

**View Coverage:**
```bash
bunx vitest run --coverage
```

## Test Types

**Unit Tests:**
- Pure logic is tested with direct input/output assertions, for example `src/command-sources/makefile-parser.test.ts`, `src/config/schema.test.ts`, and `src/config/strip-json-comments.test.ts`.

**Integration Tests:**
- The dominant pattern is lightweight integration testing using real temp directories and real file reads/writes, for example `src/plugin.test.ts`, `src/plugin/command-inject.test.ts`, `src/command-sources/makefile-source.test.ts`, and `src/skills/discovery.test.ts`.

**E2E Tests:**
- Not detected.

## Common Patterns

**Async Testing:**
```typescript
await withTempDir(async (dir) => {
  const result = await discoverSkills({
    projectRoot: dir,
    roots: [rootA, rootB],
    logger: { warn: vi.fn() },
  })

  expect(result.map((item) => item.name)).toEqual(["skill:alpha", "skill:beta"])
})
```
- This pattern comes from `src/skills/discovery.test.ts`.

**Error Testing:**
```typescript
const warn = vi.fn<(message: string) => void>()
const commands = await source.load({ rootDir: dir, logger: { warn } })

expect(commands).toEqual([])
expect(warn).toHaveBeenCalledWith(expect.stringContaining("package.json"))
```
- This pattern is used in `src/command-sources/npm-scripts-source.test.ts` and related source tests.

---

*Testing analysis: 2026-03-26*
