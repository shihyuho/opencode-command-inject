# opencode-commands-wire

在啟動階段掃描專案根目錄，將可用任務自動注入 slash command catalog。

## Dynamic command 命名規則

- Makefile target -> `make:<target>`
- `package.json` script -> `npm:<script>`

## Description 規則

- make：優先使用 `target: ## <description>` 的描述，否則 fallback 為 target 名稱
- npm：使用 script 名稱

## Template 規則

- make：`make <target> $ARGUMENTS`
- npm：`npm run <script> -- $ARGUMENTS`

## 載入行為

- 只在啟動時載入（不做熱更新）
- 缺少 `Makefile` 或 `package.json` 時跳過該來源，不中斷啟動
- 名稱衝突採保守策略：保留先出現的 command，並記錄 warning
