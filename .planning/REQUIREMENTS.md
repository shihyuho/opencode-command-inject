# Requirements

## v1 Requirements

### Config Directory Support

- [ ] **CFGDIR-01**: 使用者可以透過 `OPENCODE_CONFIG_DIR` 指定 OpenCode 資產／外掛設定目錄，plugin 會從該目錄解析自己的設定與相關資產
- [ ] **CFGDIR-02**: `OPENCODE_CONFIG_DIR` 的優先序與回退行為會與既有 `XDG_CONFIG_HOME`、`~/.config` 與既有 env override 契約共存，且在缺檔或解析問題時維持 warning + fallback 的 recoverable 行為
- [ ] **CFGDIR-03**: `OPENCODE_CONFIG_DIR` 行為會被文件與自動化測試明確固定；若實作碰觸設定契約，相關 schema / 型別 artifact 也會同步更新

## v2 Requirements

- [ ] **CFGDIR-04**: 使用者可以更細緻地區分 plugin 自身資產路徑與 OpenCode 主設定檔定位策略，而不需要共享同一組 env semantics

## Out of Scope

- 讓 `OPENCODE_CONFIG_DIR` 改寫 OpenCode 主設定檔名稱或檔案絕對路徑解析 — 這超出目前參考 PR #185 的最終範圍
- 重新設計整體 config loader precedence 模型 — 本次僅處理新增目錄來源與既有回退鏈的相容整合
- 變更既有 collision fallback、dynamic command injection 或 skill merge 契約 — 與這次 config directory 支援無直接關聯

## Traceability

| Requirement | Phase | Status |
|---|---|---|
| CFGDIR-01 | — | Unmapped |
| CFGDIR-02 | — | Unmapped |
| CFGDIR-03 | — | Unmapped |
