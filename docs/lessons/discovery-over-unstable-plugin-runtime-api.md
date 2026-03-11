---
id: discovery-over-unstable-plugin-runtime-api
date: 2026-03-10
scope: module
tags: [plugin, sdk, discovery, compatibility]
source: retrospective
confidence: 0.3
related: [[vertical-slice-before-public-options]]
---

# 當 plugin 公開 SDK 契約不穩定時，優先選 discovery-based 載入

## Context

在為 `opencode-command-inject` 設計 skill commands 時，曾嘗試改用 plugin runtime 的 `client.app.skills()` 自動取得已載入 skills。

## Mistake

公開的 `@opencode-ai/plugin` / `@opencode-ai/sdk` 型別入口無法穩定保證 `client.app.skills()` 可用，導致 runtime-based 設計依賴未明確宣告的 API，增加相容性風險與文件不一致問題。

## Lesson

若 plugin 需要的資料來源在公開 SDK 契約中不穩定或未清楚宣告，優先改採 discovery-based 載入（直接掃描本機可控來源）而不是綁 private runtime API。先保證相容與可測，再考慮 runtime integration。

## When to Apply

- plugin 想讀取宿主 runtime 狀態，但公開型別與實際行為不一致時
- 可以透過檔案系統或設定來源穩定取得同一份資料時
- review 已指出 SDK surface / compatibility 風險時
