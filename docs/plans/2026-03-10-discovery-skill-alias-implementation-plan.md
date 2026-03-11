# Discovery Skill Alias Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 `opencode-command-inject` 直接 discovery skills 目錄與 `SKILL.md`，自動建立 `skill:<name>` commands。

**Architecture:** 新增一組 skills loader 模組處理目錄 discovery、frontmatter 解析與 template 包裝，plugin 啟動時載入這些 skills，再沿用既有 `SkillCommandSource` 與 `createCommandInjectHooks()` 產生命令。

**Tech Stack:** TypeScript (ESM), Bun, Vitest, existing command-sources abstractions

---

## Chunk 1: skills loader foundations

### Task 1: 建立 frontmatter parser 與單一 skill loader

**Files:**
- Create: `src/skills/frontmatter.ts`
- Create: `src/skills/load-skill.ts`
- Create: `src/skills/frontmatter.test.ts`

- [ ] **Step 1: Write the failing tests**

先為 frontmatter 解析與 `SKILL.md` 讀取寫 failing tests，覆蓋：
- 有 frontmatter 的 skill
- 無 frontmatter 的 skill
- 空白 body / 缺 `SKILL.md`

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- src/skills/frontmatter.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

實作 frontmatter parser 與單一 skill loader，輸出最小 `LoadedSkillCommandInput`。

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- src/skills/frontmatter.test.ts`
Expected: PASS

## Chunk 2: directory discovery

### Task 2: 建立 skills discovery 與優先序

**Files:**
- Create: `src/skills/discovery.ts`
- Create: `src/skills/discovery.test.ts`

- [ ] **Step 1: Write the failing tests**

覆蓋：
- 依優先序搜尋 skills 目錄
- 同名 skill 保留第一個
- 缺目錄 / 缺 `SKILL.md` 時跳過

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- src/skills/discovery.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

實作 discovery loader，回傳 `LoadedSkillCommandInput[]`。

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- src/skills/discovery.test.ts`
Expected: PASS

## Chunk 3: plugin integration

### Task 3: 將 discovery-based skills 接進 plugin

**Files:**
- Modify: `src/plugin.ts`
- Modify: `index.ts`
- Create/Modify: `src/plugin.test.ts`

- [ ] **Step 1: Write the failing tests**

覆蓋：
- plugin 啟動會自動 discovery skills
- 會產生 `skill:<name>`
- 沒有 skills 時不影響 make/package scripts

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- src/plugin.test.ts src/plugin/command-inject.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

移除 runtime-based `client.app.skills()` 路徑，改呼叫 discovery loader。

- [ ] **Step 4: Run tests to verify it passes**

Run: `bun run test -- src/plugin.test.ts src/plugin/command-inject.test.ts`
Expected: PASS

## Chunk 4: docs and full verification

### Task 4: 更新文件與完整驗證

**Files:**
- Modify: `README.md`
- Modify: `docs/commands.md`

- [ ] **Step 1: Update docs**

改寫成 discovery-based 說明，補上 skills 目錄優先序與 migration note。

- [ ] **Step 2: Run full verification**

Run: `bun run typecheck`
Expected: PASS

Run: `bun run lint`
Expected: PASS

Run: `bun run test`
Expected: PASS
