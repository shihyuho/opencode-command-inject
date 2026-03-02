# OpenCode Plugin Design: opencode-command-inject

Date: 2026-03-02
Status: Approved

Plugin Name: `opencode-command-inject`

## 1. Goal

在 OpenCode 啟動階段自動探索專案根目錄可用任務來源，並注入為 commands：

- Makefile targets -> `make:<target>`
- npm scripts -> `npm:<script>`

命令描述規則：

- make: 若 target 行尾有 `## <description>` 則用 description，否則用 target 名稱
- npm: 先用 script 名稱

命令執行模板：

- make: `make <target> $ARGUMENTS`
- npm: `npm run <script> -- $ARGUMENTS`

## 2. Scope and Non-Goals

### In scope

- 啟動時載入（不做熱更新）
- 同時支援 Makefile 與 npm scripts
- 以可擴充架構實作 command sources
- 注入到既有 command catalog

### Out of scope

- Taskfile 支援
- 執行時 shell 行為修改
- Makefile 完整語法解析器（採盡力解析）

## 3. Architecture

採用可擴充來源架構：

1. 定義 `CommandSource` 介面（例如 `id`、`load(ctx)`）
2. 建立 `CommandSourceAggregator` 統一收集/合併命令
3. 新增兩個來源
   - `MakefileCommandSource`
   - `NpmScriptsCommandSource`
4. 啟動時由 aggregator 將來源命令合併到既有 command catalog

此做法可在不破壞既有 skill/project/user command 流程下，擴充新的命令來源。

## 4. Components and Data Flow

### 4.1 CommandSource

- 欄位
  - `id: string`
- 方法
  - `load(ctx): Promise<CommandDefinition[]>`

### 4.2 MakefileCommandSource

- 讀取專案根目錄 `Makefile`
- 掃描 target 行，提取 `target` 與可選 `## description`
- 轉換為 `make:<target>` command definitions

### 4.3 NpmScriptsCommandSource

- 讀取專案根目錄 `package.json`
- 取得 `scripts` keys
- 轉換為 `npm:<script>` command definitions

### 4.4 Aggregation flow

1. Plugin 啟動
2. Aggregator 依序呼叫各 source `load()`
3. 合併命令清單並回傳 catalog
4. 使用者在 slash command 中可看到 `make:*` 與 `npm:*`

## 5. Conflict and Error Handling

### 5.1 File missing

- 無 Makefile -> 不產生 make commands
- 無 package.json 或無 scripts -> 不產生 npm commands
- 以上皆為正常情況，不拋錯

### 5.2 Parse errors

- Makefile 非預期語法：盡力解析，無法辨識行略過
- package.json 非法 JSON：記錄 warning，跳過 npm source

### 5.3 Name conflicts

- 因命名前綴 `make:` / `npm:`，跨來源衝突機率低
- 若與既有同名 command 衝突：採保守策略「不覆蓋」，記錄 warning

### 5.4 Safety

- 啟動階段只做檔案讀取與字串解析
- 實際 shell 執行只在使用者觸發命令時發生

## 6. Testing Strategy

### 6.1 Unit tests

- Makefile parser
  - 有 `##` 描述
  - 無描述 fallback
  - 忽略無效/特殊行
- npm scripts loader
  - 正常 scripts
  - 無 scripts
  - 非法 JSON
- naming
  - 產生 `make:*`、`npm:*` 命名

### 6.2 Integration tests

- 啟動後 command catalog 包含兩來源命令
- 缺檔案時正常啟動
- 衝突時不覆蓋且有 warning

### 6.3 Manual verification

- 建立範例 Makefile + package.json
- 啟動 OpenCode，確認 slash 清單可見新命令
- 觸發命令並確認 `$ARGUMENTS` 正確帶入模板

## 7. Rollout Plan

1. 引入 `CommandSource` 與 aggregator
2. 將現有來源接入 aggregator
3. 實作 Makefile source
4. 實作 npm source
5. 補齊測試與文件
