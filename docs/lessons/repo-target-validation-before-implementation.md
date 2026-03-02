---
id: repo-target-validation-before-implementation
date: 2026-03-02
scope: project
tags: [planning, repo-validation, execution, docs-driven]
source: user-correction
related: []
---

# 在文件驅動實作前先核對目標程式碼是否存在

## Context

使用者要求依 `docs/plans/*implementation-plan.md` 開始實作，計畫內容引用多個 `src/...` TypeScript 檔案。

## Mistake

若未先核對 repository 內容，會直接進入實作流程並在中途才發現缺檔，造成流程中斷與額外溝通成本。

## Lesson

文件驅動開發在「動手前」必須先驗證目標 repo 是否具備計畫中提及的主體程式碼（例如 `src/`、`package.json`、測試入口）。若不具備，先與使用者確認是切換 repo 還是就地建立骨架。

## When to Apply

- 使用者提供設計/計畫文件並要求「開始實作」時
- 計畫引用的路徑與目前工作樹看起來不一致時
- 需要避免在錯誤 repository 上投入大量實作時
