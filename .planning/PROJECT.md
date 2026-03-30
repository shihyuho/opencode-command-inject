# opencode-command-inject

## What This Is

`opencode-command-inject` 是一個 OpenCode 外掛，會從 Makefile、npm scripts 與 skills 等來源動態注入可執行指令，讓使用者在既有專案中快速暴露常用操作。它面向已經使用 OpenCode 與本地專案慣例的開發者，重點是以安全預設、可設定命名與可恢復的載入流程，把專案命令整合進 OpenCode。

## Core Value

在不破壞既有 OpenCode / 專案行為的前提下，穩定地把可發現、可設定的動態命令注入到使用者工作流中。

## Requirements

### Validated

- ✓ 使用者可以從 Makefile、npm scripts 與 skills 注入動態命令到 OpenCode — existing
- ✓ 使用者可以用專案層與使用者層設定檔控制來源開關、提示與命名前綴 — existing
- ✓ 名稱衝突與載入失敗會以 warning + safe fallback 處理，而不是讓外掛崩潰 — existing
- ✓ 外掛會發布 schema、文件與測試，維持設定契約與回歸保護 — existing

### Active

- [ ] 使用者可以透過 `OPENCODE_CONFIG_DIR` 指定 OpenCode 資產/外掛設定目錄，讓外掛在該目錄下尋找自己的設定與相關資產
- [ ] 外掛在支援 `OPENCODE_CONFIG_DIR` 時，仍維持主要 OpenCode config 檔案路徑解析的既有語義，不把自訂目錄支援擴大成不同的主設定檔定位規則
- [ ] `OPENCODE_CONFIG_DIR` 的優先序、回退行為與文件/測試要被明確固定，避免與 `XDG_CONFIG_HOME`、`~/.config` 與現有 env override 行為互相衝突

### Out of Scope

- 重新設計整個 plugin config 載入模型 — 這次初始化的直接目標是讓既有 repo 能繼續用 GSD quick/phase 流程推進，不是改寫架構
- 更動已存在的 collision fallback 與 command naming 契約 — 這些行為已有既定 guardrails，除非需求直接要求，否則不在目前 scope
- 把 `OPENCODE_CONFIG_DIR` 延伸成新的主 OpenCode config 檔名/檔案路徑 override 規則 — 參考 PR #185 的最終範圍，避免無限擴張需求

## Context

- 這是 brownfield TypeScript/Bun repo，已完成 `.planning/codebase/` 掃描，可直接引用現有架構、慣例與測試文件
- 外掛主要模組位於 `src/plugin.ts`、`src/plugin/command-inject.ts`、`src/config/loader.ts`、`src/command-sources/*` 與 `src/skills/*`
- 既有 repo guardrails 強調 recoverable config/discovery loading、固定 warning prefix，以及 config schema/types 與生成 schema artifact 的同步
- 目前外部參考是 `alvinunreal/oh-my-opencode-slim#185`，其最終收斂方向是支援 `OPENCODE_CONFIG_DIR` 作為 custom config directory，但保留標準 OpenCode 主設定檔路徑語義

## Constraints

- **Tech stack**: 維持 TypeScript + Bun + Vitest + Zod 現有實作路徑 — 避免為單一功能引入不必要基礎設施變更
- **Compatibility**: 不可破壞既有 command collision / manual skill precedence / warning prefix 行為 — 這些是 repo hard rules 與既有測試契約
- **Schema contract**: 若變更 `src/config/types.ts` 或 `src/config/schema.ts`，必須同步執行 `bun run generate-schema` — AGENTS.md 明定的 hard gate
- **Resilience**: config 與 discovery 相關失敗要 warning + fallback，不可因缺檔或解析失敗讓 plugin crash — 符合既有 loader/discovery 設計

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 先補齊 GSD project artifacts，再執行 quick task | `quick.md` 要求 active project / ROADMAP gate，這個 repo 目前只有 codebase map | — Pending |
| 把 PR #185 視為功能參考而非直接照抄 | 上游 repo 檔案結構不同，本 repo 需要做本地化映射 | — Pending |
| `OPENCODE_CONFIG_DIR` 支援必須保持 OpenCode 主設定檔路徑語義不變 | 這是參考 PR 最終範圍，也是避免需求擴張的邊界 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-30 after initialization*
