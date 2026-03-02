# opencode-command-inject Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在 OpenCode 啟動時，自動把專案根目錄的 Makefile targets 與 package.json scripts 注入為 `make:*`/`npm:*` commands。

**Plugin Name:** `opencode-command-inject`

**Architecture:** 在既有 command 組裝流程前加入可擴充的 `CommandSource` 抽象與 aggregator，並新增 `MakefileCommandSource` 與 `NpmScriptsCommandSource`。兩者只在啟動期讀檔與解析，不執行命令。最終把結果併入 command catalog，並保留衝突保守策略（不覆蓋、記 warning）。

**Tech Stack:** TypeScript、OpenCode plugin hooks、Node.js fs/path、既有 command definition 結構

---

### Task 1: 對齊注入入口與資料結構

**Files:**
- Modify: `src/hooks/auto-slash-command/executor.ts`
- Modify: `src/create-hooks.ts`
- Reference: `src/features/opencode-skill-loader/skill-definition-record.ts`

**Step 1: 寫一個失敗的整合測試（或 fixture 驗證）**

```ts
it("includes dynamic make/npm commands in command catalog", async () => {
  const commands = await buildCommandCatalogForFixture("with-make-and-npm")
  expect(commands.some((c) => c.name === "make:build")).toBe(true)
  expect(commands.some((c) => c.name === "npm:test")).toBe(true)
})
```

**Step 2: 執行測試確認失敗**

Run: `pnpm test -- auto-slash-command`
Expected: FAIL，因尚未有 Makefile/npm source 注入

**Step 3: 在 executor 導入 source aggregator 骨架（先回傳空陣列）**

```ts
const dynamicCommands: CommandInfo[] = await commandSourceAggregator.loadAll(context)
return [...existingCommands, ...dynamicCommands]
```

**Step 4: 重跑測試，確認仍失敗但進入新流程**

Run: `pnpm test -- auto-slash-command`
Expected: FAIL，但錯誤聚焦在缺少來源實作

**Step 5: Commit**

```bash
git add src/hooks/auto-slash-command/executor.ts src/create-hooks.ts
git commit -m "refactor: introduce dynamic command source aggregation"
```

### Task 2: 建立 CommandSource 抽象與 aggregator

**Files:**
- Create: `src/features/command-sources/types.ts`
- Create: `src/features/command-sources/aggregator.ts`
- Create: `src/features/command-sources/index.ts`
- Test: `src/features/command-sources/aggregator.test.ts`

**Step 1: 先寫 failing test（順序與去重策略）**

```ts
it("keeps first command on name conflict and logs warning", async () => {
  const result = await aggregate([sourceA, sourceB], ctx)
  expect(result.find((c) => c.name === "make:build")?.description).toBe("from A")
  expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("make:build"))
})
```

**Step 2: 執行測試確認失敗**

Run: `pnpm test -- command-sources/aggregator`
Expected: FAIL，型別與函式尚不存在

**Step 3: 實作最小介面與 aggregator**

```ts
export interface CommandSource {
  id: string
  load(ctx: LoadContext): Promise<CommandDefinition[]>
}
```

**Step 4: 重跑測試確認通過**

Run: `pnpm test -- command-sources/aggregator`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/command-sources
git commit -m "feat: add command source abstraction and aggregator"
```

### Task 3: 實作 MakefileCommandSource

**Files:**
- Create: `src/features/command-sources/makefile-source.ts`
- Create: `src/features/command-sources/makefile-parser.ts`
- Test: `src/features/command-sources/makefile-parser.test.ts`
- Test: `src/features/command-sources/makefile-source.test.ts`

**Step 1: 先寫 parser failing tests**

```ts
it("extracts target and ## description", () => {
  const items = parseMakefile("build: ## Build app")
  expect(items).toEqual([{ target: "build", description: "Build app" }])
})

it("falls back to target when no description", () => {
  const items = parseMakefile("lint:")
  expect(items).toEqual([{ target: "lint", description: "lint" }])
})
```

**Step 2: 跑測試確認失敗**

Run: `pnpm test -- makefile-parser`
Expected: FAIL

**Step 3: 實作最小 parser/source**

```ts
name: `make:${target}`,
description,
template: `make ${target} $ARGUMENTS`,
```

**Step 4: 重跑測試確認通過**

Run: `pnpm test -- makefile`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/command-sources/makefile-*.ts
git commit -m "feat: add makefile command source"
```

### Task 4: 實作 NpmScriptsCommandSource

**Files:**
- Create: `src/features/command-sources/npm-source.ts`
- Test: `src/features/command-sources/npm-source.test.ts`

**Step 1: 先寫 failing tests（正常 scripts、無 scripts、非法 JSON）**

```ts
it("maps scripts to npm commands", async () => {
  const commands = await source.load(ctxWithPackageJson({ scripts: { test: "vitest" } }))
  expect(commands[0].name).toBe("npm:test")
})
```

**Step 2: 跑測試確認失敗**

Run: `pnpm test -- npm-source`
Expected: FAIL

**Step 3: 實作最小 source**

```ts
name: `npm:${script}`,
description: script,
template: `npm run ${script} -- $ARGUMENTS`,
```

**Step 4: 重跑測試確認通過**

Run: `pnpm test -- npm-source`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/command-sources/npm-source.ts src/features/command-sources/npm-source.test.ts
git commit -m "feat: add npm scripts command source"
```

### Task 5: 接線到啟動流程與回歸驗證

**Files:**
- Modify: `src/hooks/auto-slash-command/executor.ts`
- Modify: `src/plugin/hooks/create-skill-hooks.ts`
- Test: `src/hooks/auto-slash-command/executor.test.ts`

**Step 1: 先寫 failing integration test（來源全部串起來）**

```ts
it("injects make and npm commands during startup", async () => {
  const commands = await executeWithFixture("with-make-and-package-json")
  expect(commands.map((c) => c.name)).toContain("make:build")
  expect(commands.map((c) => c.name)).toContain("npm:test")
})
```

**Step 2: 執行測試確認失敗**

Run: `pnpm test -- auto-slash-command/executor`
Expected: FAIL

**Step 3: 串接 aggregator 與兩個 source 到啟動流程**

```ts
const dynamicSources = [new MakefileCommandSource(), new NpmScriptsCommandSource()]
const dynamicCommands = await aggregate(dynamicSources, context)
```

**Step 4: 執行測試與型別檢查**

Run: `pnpm test -- auto-slash-command`
Expected: PASS

Run: `pnpm typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/auto-slash-command src/plugin/hooks/create-skill-hooks.ts
git commit -m "feat: inject makefile and npm scripts as startup commands"
```

### Task 6: 文件與驗證完成

**Files:**
- Modify: `README.md`
- Modify: `docs/commands.md` (若存在)
- Create: `docs/examples/make-and-npm-commands.md` (若需要)

**Step 1: 補文件（命名規則、description 規則、啟動載入行為）**

```md
- make commands: make:<target>
- npm commands: npm:<script>
- Loaded at startup only
```

**Step 2: 執行最終驗證**

Run: `pnpm test`
Expected: PASS

Run: `pnpm lint`
Expected: PASS

**Step 3: 手動 smoke test**

Run: `opencode`
Expected: slash command 清單可見 `make:*` 與 `npm:*`

**Step 4: Commit**

```bash
git add README.md docs
git commit -m "docs: describe dynamic make and npm commands"
```
