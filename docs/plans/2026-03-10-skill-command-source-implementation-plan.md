# Skill Command Source Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 讓 `opencode-command-inject` 能把外部傳入的 loaded skills 轉成 `skill:<name>` commands，並與既有 Makefile 與 package scripts sources 一起注入 catalog。

**Architecture:** 延續既有 `CommandSource`/`aggregateCommandSources()` 架構，新增 `SkillCommandSource` 負責把記憶體中的最小 skill 輸入型別轉成 `CommandInfo`。`createCommandInjectHooks()` 只負責接收 `loadedSkills`、建立 sources、沿用既有衝突處理與注入流程。

**Tech Stack:** TypeScript (ESM), Vitest, OpenCode plugin hooks, existing `src/command-sources` abstractions

---

### Task 1: 擴充 types 與 plugin options

**Files:**
- Modify: `src/command-sources/types.ts`
- Modify: `src/plugin/command-inject.ts`
- Modify: `src/command-sources/index.ts`

**Step 1: Write the failing type-driven test expectation**

在 `src/plugin/command-inject.test.ts` 先準備一個使用 `loadedSkills` 的測試呼叫，讓編譯先對新欄位失敗。

```ts
const hooks = await createCommandInjectHooks({
  projectRoot: dir,
  logger: { warn },
  existingCommands: [],
  loadedSkills: [{ name: "review", description: "Run review", template: "Use skill review $ARGUMENTS" }]
})
```

**Step 2: Run test to verify it fails**

Run: `bun run test -- src/plugin/command-inject.test.ts`
Expected: FAIL，因 `loadedSkills` 與新型別尚未定義

**Step 3: Write minimal type additions**

在 `src/command-sources/types.ts` 新增最小 skill 輸入型別，例如：

```ts
export interface LoadedSkillCommandInput {
  name: string
  description?: string
  template: string
}
```

在 `src/plugin/command-inject.ts` 的 `CommandInjectOptions` 新增：

```ts
loadedSkills?: LoadedSkillCommandInput[]
```

並從 `src/command-sources/index.ts` 匯出該型別。

**Step 4: Run test to verify the type failure is resolved**

Run: `bun run test -- src/plugin/command-inject.test.ts`
Expected: FAIL，但失敗點轉為尚未注入 `skill:*`

**Step 5: Commit**

```bash
git add src/command-sources/types.ts src/command-sources/index.ts src/plugin/command-inject.ts src/plugin/command-inject.test.ts
git commit -m "refactor: add loaded skill command input types"
```

### Task 2: 新增 SkillCommandSource 與單元測試

**Files:**
- Create: `src/command-sources/skill-source.ts`
- Create: `src/command-sources/skill-source.test.ts`
- Modify: `src/command-sources/index.ts`

**Step 1: Write the failing tests**

```ts
it("maps loaded skills to skill commands", async () => {
  const source = new SkillCommandSource([
    { name: "review", description: "Run review", template: "Use skill review $ARGUMENTS" }
  ])

  const commands = await source.load({ rootDir: "/tmp/project", logger: { warn: vi.fn() } })

  expect(commands).toEqual([
    {
      name: "skill:review",
      description: "Run review",
      template: "Use skill review $ARGUMENTS"
    }
  ])
})

it("falls back to skill name when description is missing", async () => {
  const source = new SkillCommandSource([{ name: "review", template: "Use skill review $ARGUMENTS" }])
  const commands = await source.load({ rootDir: "/tmp/project", logger: { warn: vi.fn() } })
  expect(commands[0].description).toBe("review")
})
```

再補一個略過無效名稱的測試：

```ts
it("skips entries with empty names and warns", async () => {
  const warn = vi.fn<(message: string) => void>()
  const source = new SkillCommandSource([{ name: "", template: "bad" }])
  const commands = await source.load({ rootDir: "/tmp/project", logger: { warn } })
  expect(commands).toEqual([])
  expect(warn).toHaveBeenCalledTimes(1)
})
```

**Step 2: Run test to verify it fails**

Run: `bun run test -- src/command-sources/skill-source.test.ts`
Expected: FAIL，因 `SkillCommandSource` 尚不存在

**Step 3: Write minimal implementation**

建立 `SkillCommandSource`，沿用 `CommandSource` 介面：

```ts
export class SkillCommandSource implements CommandSource {
  readonly id = "skills"

  constructor(private readonly loadedSkills: readonly LoadedSkillCommandInput[]) {}

  async load(ctx: LoadContext): Promise<CommandInfo[]> {
    return this.loadedSkills.flatMap((skill) => {
      const name = skill.name.trim()
      if (!name) {
        ctx.logger.warn("[command-sources] skipping skill command with empty name")
        return []
      }

      return [{
        name: `skill:${name}`,
        description: skill.description?.trim() || name,
        template: skill.template,
      }]
    })
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `bun run test -- src/command-sources/skill-source.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/command-sources/skill-source.ts src/command-sources/skill-source.test.ts src/command-sources/index.ts
git commit -m "feat: add skill command source"
```

### Task 3: 串接 SkillCommandSource 到 plugin 流程

**Files:**
- Modify: `src/plugin/command-inject.ts`
- Test: `src/plugin/command-inject.test.ts`

**Step 1: Write the failing integration test**

在 `src/plugin/command-inject.test.ts` 新增：

```ts
it("injects skill commands from loaded skills", async () => {
  await withTempDir(async (dir) => {
    const warn = vi.fn<(message: string) => void>()

    const hooks = await createCommandInjectHooks({
      projectRoot: dir,
      logger: { warn },
      existingCommands: [],
      loadedSkills: [
        { name: "review", description: "Run review", template: "Use skill review $ARGUMENTS" }
      ],
    })

    expect(hooks).toHaveProperty("config")
    expect(hooks).toHaveProperty("command.execute.before")
  })
})
```

再補一個衝突案例：

```ts
it("keeps existing command when skill command conflicts", async () => {
  // existingCommands 先提供 skill:review
  // loadedSkills 再提供 review
  // 預期 warning 且既有 command 保留
})
```

**Step 2: Run test to verify it fails**

Run: `bun run test -- src/plugin/command-inject.test.ts`
Expected: FAIL，因 plugin 尚未建立 `SkillCommandSource`

**Step 3: Write minimal integration code**

在 `createCommandInjectHooks()` 中建立來源陣列時加入：

```ts
const dynamicSources = [
  new MakefileCommandSource(),
  new PackageScriptsCommandSource(),
  ...(options.loadedSkills?.length ? [new SkillCommandSource(options.loadedSkills)] : []),
]
```

保留既有 merge 與 warning 策略不變。

**Step 4: Run tests to verify they pass**

Run: `bun run test -- src/plugin/command-inject.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/plugin/command-inject.ts src/plugin/command-inject.test.ts
git commit -m "feat: inject loaded skills as commands"
```

### Task 4: 補強聚合與相容性測試

**Files:**
- Modify: `src/command-sources/aggregator.test.ts`
- Modify: `src/plugin/command-inject.test.ts`

**Step 1: Write the failing conflict test for mixed sources**

在 `src/plugin/command-inject.test.ts` 新增情境：Makefile、package scripts、loaded skills 同時存在，且 `existingCommands` 有一筆相同名稱的 `skill:review`。

```ts
expect(warn).toHaveBeenCalledWith(expect.stringContaining("skill:review"))
```

必要時也可在 `src/command-sources/aggregator.test.ts` 增加一個 source id 為 `skills` 的衝突案例，確認 aggregator 行為不依來源類型而改變。

**Step 2: Run test to verify it fails**

Run: `bun run test -- src/plugin/command-inject.test.ts`
Expected: FAIL，直到 mixed-source 衝突情境被正確處理

**Step 3: Write minimal adjustments if needed**

若測試失敗，僅做最小修改，維持：

```ts
if (existingNames.has(command.name)) {
  options.logger.warn(...)
  continue
}
```

避免為 skill source 特判。

**Step 4: Run focused tests to verify they pass**

Run: `bun run test -- src/command-sources/aggregator.test.ts`
Expected: PASS

Run: `bun run test -- src/plugin/command-inject.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/command-sources/aggregator.test.ts src/plugin/command-inject.test.ts
git commit -m "test: cover skill command conflicts"
```

### Task 5: 文件與整體驗證

**Files:**
- Modify: `docs/commands.md`
- Modify: `README.md`
- Reference: `docs/plans/2026-03-10-skill-command-source-design.md`

**Step 1: Update docs**

在文件中補上：

```md
- Skill commands use the `skill:<name>` naming convention.
- Skill commands are created from externally provided `loadedSkills`.
- This package does not discover skills on its own.
```

**Step 2: Run targeted and full verification**

Run: `bun run test -- src/command-sources/skill-source.test.ts`
Expected: PASS

Run: `bun run typecheck`
Expected: PASS

Run: `bun run lint`
Expected: PASS

Run: `bun run test`
Expected: PASS

**Step 3: Commit**

```bash
git add README.md docs/commands.md
git commit -m "docs: describe skill command source support"
```
