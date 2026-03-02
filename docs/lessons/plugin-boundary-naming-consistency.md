---
id: plugin-boundary-naming-consistency
date: 2026-03-02
scope: module
tags: [naming, plugin, hooks, architecture]
source: user-correction
related: []
---

# Hook 命名應優先對齊 plugin 邊界而非通用流程名稱

## Context

在 command-inject 功能中，hook 路徑使用了 `auto-slash-command` 命名，使用者指出名稱沒有對齊 plugin 名稱。

## Mistake

沿用通用流程命名會讓模組責任邊界模糊，閱讀者難以從路徑快速判斷該 hook 屬於哪個 plugin 功能。

## Lesson

當功能是 plugin 特定能力時，檔案與符號命名應優先對齊 plugin 邊界（例如 `command-inject`），而不是用泛化流程名稱。這能降低維護時的定位成本。

## When to Apply

- 新增 plugin-specific hook 或 adapter 時
- 重構路徑命名以提升可讀性與可維護性時
- 同一流程可能被多個 plugin 使用，需避免命名歧義時
