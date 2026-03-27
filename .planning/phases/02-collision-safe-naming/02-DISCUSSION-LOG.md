# Phase 2: Collision-Safe Naming - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 02-collision-safe-naming
**Areas discussed:** 觸發時機, 影響範圍, 警告訊息, 最終收斂

---

## 觸發時機

| Option | Description | Selected |
|--------|-------------|----------|
| 兩層都套用 | 動態來源彼此衝突、以及動態命令撞到既有 command/config，都先嘗試改回 canonical prefix | ✓ |
| 只處理動態互撞 | 只在 make/npm/skill 彼此衝突時 fallback；撞到既有 command/config 維持 keep-existing | |
| 只處理去前綴互撞 | 只有因 disable/custom prefix 新引入的 collision 才 fallback；其他維持 keep-first | |

**User's choice:** 兩層都套用
**Notes:** 後續補充決定：fallback 只處理 prefix disable 或 custom value 引入的新 collision；若 collision 與 prefix 功能無關，仍維持既有 keep-first。

---

## 影響範圍

| Option | Description | Selected |
|--------|-------------|----------|
| 只回退衝突命令 | 只有撞到的命令改回 canonical prefix，其餘命令維持使用者設定 | ✓ |
| 整個來源一起回退 | 某來源有一個 collision 就把該來源全部改回 canonical prefix | |
| 整組衝突一起回退 | 只回退同一 collision 群組中的命令，不波及其他命令 | |

**User's choice:** 只回退衝突命令
**Notes:** 後續補充決定：同一 collision 群組內的命令要整組一起回退 canonical；但不擴大到整個來源。

---

## 警告訊息

| Option | Description | Selected |
|--------|-------------|----------|
| 一則完整摘要 | 每個 collision 群組輸出 1 則 warning，包含原名稱、fallback 後名稱、涉及來源 | ✓ |
| 每個命令各一則 | 每個被改名的命令各自 warning | |
| 簡短提示即可 | 只提示發生 collision 並已 fallback，不列完整對照 | |

**User's choice:** 一則完整摘要
**Notes:** 後續補充決定：warning prefix 保留分層；source 間 collision 用 `[command-sources]`，撞既有 command/config 用 `[command-inject]`。

---

## 最終收斂

| Option | Description | Selected |
|--------|-------------|----------|
| 回到現有 keep-first | canonical fallback 已盡力；若 canonical 仍衝突，就沿用現有 keep-first + warning | ✓ |
| 直接全部跳過 | canonical 也撞時，不注入這組命令 | |
| 再做第二層改名 | 再加來源 ID 或 suffix 等新命名策略 | |

**User's choice:** 回到現有 keep-first
**Notes:** 若 canonical fallback 仍無法解開 collision，warning 要明講已嘗試 fallback，但最終仍採 keep-first。

---

## the agent's Discretion

- 偵測「這個 collision 是否由 prefix 功能引入」的內部資料流與演算法。
- fallback 與 warning 的內部實作細節，只要符合已鎖定決策與現有 logger prefix 慣例。

## Deferred Ideas

None.
