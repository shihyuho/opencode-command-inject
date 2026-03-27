# Phase 1: Prefix Controls & Safe Defaults - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 01-prefix-controls-safe-defaults
**Areas discussed:** Prefix precedence, Name outputs

---

## Prefix precedence

| Option | Description | Selected |
|--------|-------------|----------|
| Value 直接生效 | 只要 source 指定 `value`，那個 source 就恢復帶 prefix，名稱直接變成 `value:name`。 | |
| 必須再明確開啟 | 除了 `value` 之外，還要額外設 enabled/disable override，否則仍維持無 prefix。 | |
| 視為無效設定 | 全域關閉時不允許 source 用 `value` 重新打開，應忽略或警告。 | ✓ |

**User's choice:** 視為無效設定
**Notes:** User does not want a custom `value` to implicitly reactivate prefixing when global prefixing is off.

| Option | Description | Selected |
|--------|-------------|----------|
| 忽略並警告 | 保留全域關閉結果，該 source 仍產生無 prefix 名稱，並記一則 warning。 | |
| 直接報錯停止 | 把這種組合視為配置錯誤，中止或拒絕載入設定。 | |
| 忽略不警告 | 靜默忽略 `value`，只套用全域關閉。 | ✓ |

**User's choice:** 忽略不警告
**Notes:** Invalid activation-by-value should not add warning noise in Phase 1.

| Option | Description | Selected |
|--------|-------------|----------|
| 繼承 / 強制開 / 強制關 | source 預設繼承全域；需要時可明確開或關，custom `value` 只在開啟狀態下生效。 | ✓ |
| 只有繼承 / 自訂 value | 不提供單獨強制開關；有 `value` 就改 prefix，沒有就跟全域走。 | |
| 只靠布林覆寫 | source 只能 true/false 覆寫全域，不支援獨立的繼承狀態。 | |

**User's choice:** 繼承 / 強制開 / 強制關
**Notes:** The user wants explicit per-source override states, not implicit value-driven behavior.

| Option | Description | Selected |
|--------|-------------|----------|
| 用既有 canonical prefix | makefile 用 `make:`、npm-scripts 用 runner 前綴、skill 用 `skill:`，維持現在的命名心智模型。 | ✓ |
| 用全域預設 prefix | 由 top-level 提供一個共享前綴給所有 source。 | |
| 交給實作決定 | planner / implementer 可依 source 自行決定。 | |

**User's choice:** 用既有 canonical prefix
**Notes:** Force-on without a custom value should preserve today's per-source canonical naming.

| Option | Description | Selected |
|--------|-------------|----------|
| 欄位逐層覆蓋 | 沿用現在的 deep-merge；project 只改自己有寫的欄位，其餘保留 user config。 | ✓ |
| 整個 source 設定取代 | project 只要寫了這個 source，就整包覆蓋 user config 的該 source 設定。 | |
| 只補空缺不覆蓋 | project 只能補 user config 沒寫的欄位，不能推翻既有設定。 | |

**User's choice:** 欄位逐層覆蓋
**Notes:** This keeps prefix controls aligned with the repo's existing merge behavior in `src/config/loader.ts`.

---

## Name outputs

| Option | Description | Selected |
|--------|-------------|----------|
| 直接用原始名稱 | makefile 用 target、npm-scripts 用 script 名、skill 用 normalize 後的 skill 名；不再補 source 前綴。 | ✓ |
| 保留部分來源資訊 | 例如 skill 保留 namespace、npm-scripts 保留 runner，但 makefile 去掉 `make:`。 | |
| 交給 source 自己決定 | 不同 source 可有不同無 prefix 命名規則。 | |

**User's choice:** 直接用原始名稱
**Notes:** When prefixing is off for a source, the visible command name should be the source's raw command identity.

| Option | Description | Selected |
|--------|-------------|----------|
| 保留 namespace | 只移除最外層 `skill:`，其餘 skill 自己的階層名稱照留。 | ✓ |
| 全部扁平化 | 把巢狀 skill 名再壓平成單一片段，避免冒號。 | |
| 你決定 | 讓實作者依現有 normalize 規則處理。 | |

**User's choice:** 保留 namespace
**Notes:** Nested skill naming should keep its own hierarchy after the outer source prefix is removed.

| Option | Description | Selected |
|--------|-------------|----------|
| 沿用 runner 前綴 | 維持現在行為，例如 `pnpm:dev`、`npm:test`、`bun:build`。 | ✓ |
| 固定用 npm-scripts | 不管 runner 是什麼，都統一變成 `npm-scripts:name`。 | |
| 改成 package manager 類別名 | 只保留 `node:`、`js:` 這種較抽象前綴。 | |

**User's choice:** 沿用 runner 前綴
**Notes:** Canonical npm-scripts naming should continue to reflect the detected runner.

| Option | Description | Selected |
|--------|-------------|----------|
| 完全取代 canonical prefix | 三種 source 都直接輸出成 `value:name`，不再保留 `make:` / runner / `skill:`。 | ✓ |
| 作為額外前綴 | 變成 `value:make:name`、`value:pnpm:name` 這種雙前綴。 | |
| 只對部分 source 生效 | 例如 skill 可自訂，makefile / npm-scripts 仍保留 canonical prefix。 | |

**User's choice:** 完全取代 canonical prefix
**Notes:** A custom prefix should be the single visible prefix across all Phase 1 sources.

---

## the agent's Discretion

- Exact config field names and schema encoding.
- Exact helper structure for deriving canonical vs raw vs custom names.
- Test file split and fixture detail.

## Deferred Ideas

- Collision fallback behavior and warning contract belong to Phase 2.
