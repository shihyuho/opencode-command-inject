---
id: command-source-extension-via-source-abstraction
date: 2026-03-10
scope: module
tags: [command-sources, plugin, architecture, extensibility]
source: retrospective
confidence: 0.3
related: [[plugin-boundary-naming-consistency]]
---

# 新命令來源應優先擴充 CommandSource 而不是直接塞進 plugin merge 邏輯

## Context

在為 `opencode-command-inject` 設計 skill commands 時，需要決定是新增一個 skill 專用 source，還是直接在 `src/plugin/command-inject.ts` 內把 loaded skills 轉成 commands。

## Mistake

若直接在 plugin 層內部做來源轉換，命令來源規則會分散在多個邊界，之後新增來源時更容易讓 plugin 檔案膨脹，也不利於沿用既有聚合與衝突測試模式。

## Lesson

當新資料來源本質上也是一種 command producer 時，應優先新增 `CommandSource` 實作並交給既有 aggregator，而不是在 plugin merge 流程中硬塞特例。這樣可維持邊界清楚、測試一致、擴充成本較低。

## When to Apply

- 需要為 `opencode-command-inject` 新增第三種以上命令來源時
- 來源資料不是從檔案來，但仍能被正規化為 `CommandInfo` 時
- 評估應把邏輯放在 `src/plugin/command-inject.ts` 還是 `src/command-sources/` 時
