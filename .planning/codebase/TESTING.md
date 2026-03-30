# Testing Patterns

**Analysis Date:** 2026-03-30

## Test Framework

**Runner:**
- Vitest 3.2.4
- Config: no standalone `vitest.config.*` detected; test environment is driven by `package.json` scripts and `tsconfig.json` types.

**Assertion Library:**
- Vitest `expect`, including `expectTypeOf`, from files such as `src/plugin.test.ts` and `src/config/types.test.ts`.

**Run Commands:**
```bash
bun run test              # Run all tests via vitest run
bun x vitest              # Run Vitest in interactive/watch mode
bun run test -- --coverage  # Coverage run if coverage provider is available locally
bun run typecheck         # Type-check test and source contracts
bun run lint              # Lint source after test changes
```

## Test File Organization

**Location:**
- Tests are co-located under `src/`; no separate `test/` directory is used.
- Utility helpers for tests live in `src/test-utils/`, currently `src/test-utils/temp-dir.ts`.

**Naming:**
- Use `*.test.ts` next to the implementation under test, such as `src/config/loader.test.ts`, `src/skills/discovery.test.ts`, and `src/command-sources/makefile-parser.test.ts`.

**Structure:**
```
src/
├── config/
│   ├── loader.ts
│   └── loader.test.ts
├── command-sources/
│   ├── aggregator.ts
│   └── aggregator.test.ts
└── skills/
    ├── discovery.ts
    └── discovery.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
describe("config loader", () => {
  it("supports .jsonc format with comments", async () => {
    const config = await loadPluginConfig(tmpDir)
    expect(config.sources?.makefile?.disable).toBe(false)
  })
})
```
- This pattern appears directly in `src/config/loader.test.ts`.

**Patterns:**
- Group by exported unit using top-level `describe(...)`, as in `src/plugin.test.ts`, `src/command-sources/aggregator.test.ts`, and `src/skills/discovery.test.ts`.
- Use nested `describe(...)` blocks for behavior families, such as `describe("config integration", ...)` in `src/plugin.test.ts` and `describe("prefix normalization", ...)` in `src/command-sources/skill-source.test.ts`.
- Use explicit scenario names in `it(...)`. Complex regression cases are labeled with stable IDs like `TEST-01` through `TEST-04` in `src/plugin/command-inject.test.ts`, `src/command-sources/command-name-prefix.test.ts`, and `src/command-sources/aggregator.test.ts`.

## Mocking

**Framework:** Vitest `vi`

**Patterns:**
```typescript
vi.mock("./skills/discovery", () => ({
  discoverSkills: vi.fn(),
}))

vi.mocked(discoverSkills).mockResolvedValue([
  {
    name: "review",
    description: "Run review",
    template: "Use skill review",
    body: "Use skill review",
    sourcePath: "/tmp/review/SKILL.md",
  },
])
```
- This is the standard module-mocking style in `src/plugin.test.ts`.

```typescript
const warn = vi.fn<(message: string) => void>()
const context: LoadContext = { rootDir: "/tmp/project", logger: { warn } }
```
- Logger spies are injected as dependencies in `src/command-sources/aggregator.test.ts`, `src/plugin/command-inject.test.ts`, and many source tests.

**What to Mock:**
- Mock module boundaries and external I/O seams: `src/plugin.test.ts` mocks `./skills/discovery` and `./config`; `src/command-sources/npm-scripts-runner.test.ts` mocks `node:fs/promises`.
- Mock logging with `vi.fn()` and assert exact warning text/prefixes when behavior depends on guardrails.

**What NOT to Mock:**
- Do not mock core parsing/merge behavior when filesystem-backed integration is cheap. Tests for `src/config/loader.ts`, `src/skills/discovery.ts`, and `src/plugin/command-inject.ts` prefer temp directories and real files.
- Do not mock command aggregation/collision policy unless the test is specifically isolating one layer. `src/command-sources/aggregator.test.ts` uses small fake sources but real aggregation logic.

## Fixtures and Factories

**Test Data:**
```typescript
await withTempDir(async (dir) => {
  await writeText(join(dir, "Makefile"), "build: ## Build app")
  await writeText(join(dir, "package.json"), JSON.stringify({ scripts: { test: "vitest" } }))
})
```
- This real-file fixture pattern is used in `src/plugin/command-inject.test.ts` and `src/plugin.test.ts`.

```typescript
async function writeSkill(root: string, skillName: string, content: string): Promise<void> {
  const dir = join(root, skillName)
  await mkdir(dir)
  await writeText(join(dir, "SKILL.md"), content)
}
```
- This helper-style inline fixture lives in `src/skills/discovery.test.ts`.

**Location:**
- Shared helpers live in `src/test-utils/temp-dir.ts`.
- One-off fixtures stay inside each test file as local helpers or inline JSON/string literals.

## Coverage

**Requirements:** None enforced in repo config.

**View Coverage:**
```bash
bun run test -- --coverage
```
- Coverage is not wired into `package.json`; use an extra Vitest flag when the local environment has a coverage provider.

## Test Types

**Unit Tests:**
- Pure units are tested directly with deterministic inputs, such as `src/command-sources/command-name-prefix.test.ts`, `src/config/strip-json-comments.test.ts`, and `src/skills/frontmatter.test.ts`.

**Integration Tests:**
- File- and workflow-level integration tests are common. `src/config/loader.test.ts`, `src/skills/discovery.test.ts`, `src/plugin.test.ts`, and `src/plugin/command-inject.test.ts` exercise real temp directories plus multiple collaborating modules.

**E2E Tests:**
- Not used.

## Common Patterns

**Async Testing:**
```typescript
await withTempDir(async (dir) => {
  const hooks = await CommandInjectPlugin(createPluginInput(dir))
  const config = { command: {} as Record<string, { template: string; description: string }> }
  await hooks.config?.(config as never)
  expect(config.command).toHaveProperty("skill:review")
})
```
- This pattern appears in `src/plugin.test.ts` and `src/plugin/command-inject.test.ts`.

**Error Testing:**
```typescript
const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
expect(warnSpy).toHaveBeenCalledWith(
  "[command-inject] duplicate discovered skill 'review', keeping manually provided version"
)
```
- Exact warning assertions are part of the repo's safety contract in `src/plugin.test.ts`, `src/plugin/command-inject.test.ts`, and `src/command-sources/aggregator.test.ts`.

## Quality Gates to Preserve

- When changing `src/config/types.ts` or `src/config/schema.ts`, run `bun run generate-schema` and keep `src/config/schema.test.ts` passing against `opencode-command-inject.schema.json`.
- When changing collision, duplicate, or fallback logic in `src/plugin.ts`, `src/plugin/command-inject.ts`, or `src/command-sources/aggregator.ts`, run at least:
```bash
bun run test src/plugin.test.ts src/plugin/command-inject.test.ts src/command-sources/aggregator.test.ts src/command-sources/command-name-prefix.test.ts
```
- When changing config loading or file discovery behavior, run at least:
```bash
bun run test src/config/loader.test.ts src/config/schema.test.ts src/skills/discovery.test.ts
```
- Before finishing any code change, keep the repo-wide verification trio green:
```bash
bun run test
bun run typecheck
bun run lint
```

---

*Testing analysis: 2026-03-30*
