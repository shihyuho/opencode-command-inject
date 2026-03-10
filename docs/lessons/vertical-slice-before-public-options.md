---
id: vertical-slice-before-public-options
date: 2026-03-10
scope: module
tags: [planning, api-design, tdd, plugin]
source: retrospective
confidence: 0.3
related: [[command-source-extension-via-source-abstraction]]
---

# 分階段實作時應優先交付可用垂直切片，而不是先公開 dead option

## Context

在為 `opencode-command-inject` 新增 skill command source 時，原本把 `loadedSkills` 先加進 public options，再留待下一個 task 才真正消費它。

## Mistake

先公開尚未被 runtime 使用的 option，會留下 dead parameter、誤導性測試，並讓 code review 卡在「API 已擴張但功能尚未成立」的尷尬狀態。

## Lesson

若某個新 option 只有在搭配後續 source / adapter / runtime 接線後才有意義，應優先把它和最小可用垂直切片一起落地，再做 review。避免把「型別先行、行為後補」切成會產生半套 API 的 task。

## When to Apply

- 新增 plugin options、hook options、CLI flags，但行為尚未真正接線時
- 規劃多 task 漸進式實作時，需要決定切 task 的邊界
- code review 指出 dead parameter、誤導性測試、未被使用的 public API 時
