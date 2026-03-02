# Package Runner Detection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 讓 `package.json` scripts 產生的 commands 能自動使用專案實際 runner（npm/pnpm/yarn/bun），避免固定 `npm run` 造成執行失敗。

**Architecture:** 新增獨立的 runner 偵測模組，先讀 `packageManager`，再看 lockfile，最後 fallback `npm`。`NpmScriptsCommandSource` 改為依 runner 產生 template。因 OpenCode plugin tool 名稱有字元限制，保留 slash command 顯示命名（如 `npm:test`）但另定安全的 tool id 映射（只含 `[a-zA-Z0-9_-]`）。

**Tech Stack:** TypeScript, Node.js fs/path, Vitest, OpenCode plugin hooks

---

### Task 1: 新增 runner 偵測模組（TDD）

**Files:**
- Create: `src/command-sources/package-runner.ts`
- Create: `src/command-sources/package-runner.test.ts`

**Step 1: 寫 failing tests（packageManager 優先、lockfile fallback、npm fallback）**

```ts
it("prefers packageManager field when present", async () => {
  // packageManager: "pnpm@10.0.0" -> "pnpm"
})

it("falls back to lockfile when packageManager is missing", async () => {
  // yarn.lock -> "yarn"
})

it("falls back to npm when nothing indicates a runner", async () => {
  // no packageManager, no lockfile -> "npm"
})
```

**Step 2: 跑測試確認失敗**

Run: `pnpm test -- src/command-sources/package-runner.test.ts`
Expected: FAIL（模組尚不存在）

**Step 3: 實作最小 runner 偵測**

```ts
export type PackageRunner = "npm" | "pnpm" | "yarn" | "bun"
export async function detectPackageRunner(rootDir: string): Promise<PackageRunner>
```

**Step 4: 重跑測試確認通過**

Run: `pnpm test -- src/command-sources/package-runner.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/command-sources/package-runner.ts src/command-sources/package-runner.test.ts
git commit -m "feat: detect package runner from packageManager and lockfiles"
```

### Task 2: 將 npm source 改為 runner-aware template（TDD）

**Files:**
- Modify: `src/command-sources/npm-source.ts`
- Modify: `src/command-sources/npm-source.test.ts`

**Step 1: 寫 failing tests（pnpm/yarn/bun template）**

```ts
it("uses pnpm run template when project runner is pnpm", async () => {
  expect(commands[0].template).toBe("pnpm run test -- $ARGUMENTS")
})

it("uses bun run template when project runner is bun", async () => {
  expect(commands[0].template).toBe("bun run test -- $ARGUMENTS")
})
```

**Step 2: 跑測試確認失敗**

Run: `pnpm test -- src/command-sources/npm-source.test.ts`
Expected: FAIL（目前固定 `npm run`）

**Step 3: 在 source 引入 `detectPackageRunner` 並套用 template**

```ts
const runner = await detectPackageRunner(ctx.rootDir)
template: `${runner} run ${script} -- $ARGUMENTS`
```

**Step 4: 重跑測試確認通過**

Run: `pnpm test -- src/command-sources/npm-source.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/command-sources/npm-source.ts src/command-sources/npm-source.test.ts
git commit -m "feat: generate script commands with detected package runner"
```

### Task 3: 解決 tool name 限制（保留 slash 命名、新增 safe tool id）

**Files:**
- Modify: `src/plugin/commands-wire.ts`
- Modify: `src/plugin/commands-wire.test.ts`
- (Optional) Create: `src/plugin/tool-name.ts`
- (Optional) Create: `src/plugin/tool-name.test.ts`

**Step 1: 寫 failing tests（`npm:test` 仍可當 command 名稱、tool id 轉成合法）**

```ts
it("keeps command key as npm:test in config.command", async () => {
  expect(config.command["npm:test"]).toBeDefined()
})

it("maps command names to safe tool ids", async () => {
  expect(toolIdFromCommandName("npm:test")).toBe("npm_test")
})
```

**Step 2: 跑測試確認失敗**

Run: `pnpm test -- src/plugin/commands-wire.test.ts`
Expected: FAIL（尚未有映射邏輯）

**Step 3: 實作 command name -> tool id 映射與去重策略**

```ts
// npm:test -> npm_test
// make:build -> make_build
// duplicate suffix strategy: _2, _3 ...
```

**Step 4: 重跑測試確認通過**

Run: `pnpm test -- src/plugin/commands-wire.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/plugin/commands-wire.ts src/plugin/commands-wire.test.ts src/plugin/tool-name*.ts
git commit -m "fix: map command names to safe plugin tool ids"
```

### Task 4: 端到端回歸與文件更新

**Files:**
- Modify: `README.md`
- Modify: `docs/commands.md`
- Modify: `docs/examples/make-and-npm-commands.md`

**Step 1: 補文件（runner 偵測優先序 + 名稱策略）**

```md
- scripts runner resolution: packageManager -> lockfile -> npm
- slash command names keep `npm:<script>`
- plugin tool ids are normalized to `[a-zA-Z0-9_-]+`
```

**Step 2: 跑完整驗證**

Run: `pnpm test`
Expected: PASS

Run: `pnpm typecheck`
Expected: PASS

Run: `pnpm lint`
Expected: PASS

**Step 3: 手動驗證**

Run: `pnpm build`
Expected: 產生 `.opencode/plugins/commands-wire.js`

Run: `opencode --print-logs`
Expected: 看見 runner 偵測結果與合法 tool ids，無 pattern validation error

**Step 4: Commit**

```bash
git add README.md docs src
git commit -m "docs: clarify runner detection and tool id normalization"
```
