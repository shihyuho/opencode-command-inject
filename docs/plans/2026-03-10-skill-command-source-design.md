# OpenCode Plugin Design: skill command source

Date: 2026-03-10
Status: Approved

Plugin Name: `opencode-command-inject`

## 1. Goal

在既有 `make:*`、`npm:*`/`pnpm:*`/`bun:*` 之外，支援把外部傳入的 loaded skills 轉成可注入的 commands：

- skill commands -> `skill:<name>`

命令描述規則：

- skill: 若有 `description` 則使用
- skill: 若無 `description`，fallback 為原始 skill 名稱

命令執行模板規則：

- skill: 使用固定包裝模板，並保留 `$ARGUMENTS`

## 2. Scope and Non-Goals

### In scope

- 由外部傳入 loaded skills
- 以新的 `CommandSource` 實作轉換 skills -> commands
- 將 skill commands 注入既有 command catalog
- 延續既有重名保守策略（不覆蓋、記 warning）
- 保持最小輸入型別，避免直接耦合上游完整 skill 物件

### Out of scope

- 在此 repo 內做 skills discovery
- 在此 repo 內定義或執行真正的 skill runtime protocol
- 熱更新 skills
- 支援複雜 skill metadata 映射

## 3. Architecture

採用既有 `command-sources` 可擴充架構，新增第三種來源：

1. 在 `src/command-sources/types.ts` 新增最小 skill 輸入型別
2. 新增 `SkillCommandSource`
3. 在 `src/plugin/command-inject.ts` 把外部傳入 `loadedSkills` 包成 source 後交給 aggregator
4. 由 aggregator 與既有 command merge 流程統一處理衝突與注入

此做法讓 skill commands 與 Makefile / package scripts 維持相同擴充點，避免把轉換邏輯塞回 plugin 層。

## 4. Components and Data Flow

### 4.1 Minimal skill input

建議新增最小輸入型別，例如：

- `name: string`
- `description?: string`
- `template: string`

這個型別只承載 command 轉換必需資料，不直接依賴上游完整 skill model。

### 4.2 SkillCommandSource

- 建構時接收 `loadedSkills`
- `load()` 不做檔案讀取與 discovery，只將記憶體中的 skill inputs 轉成 `CommandInfo[]`
- 每筆輸出為：
  - `name: skill:<skillName>`
  - `description: description ?? skillName`
  - `template: 固定包裝格式，並保留 $ARGUMENTS`

### 4.3 Plugin integration

- `CommandInjectOptions` 新增 `loadedSkills?: LoadedSkillCommandInput[]`
- `createCommandInjectHooks()` 建立 sources 時，若 `loadedSkills` 非空則加入 `SkillCommandSource`
- `src/plugin.ts` 的預設 plugin 入口維持保守行為，若沒有外部 skill 資料則傳入空陣列或省略該選項

### 4.4 Aggregation flow

1. 呼叫端提供 `projectRoot`、`existingCommands`、`loadedSkills`
2. Plugin 建立 `MakefileCommandSource`、`PackageScriptsCommandSource`，並視需要加入 `SkillCommandSource`
3. `aggregateCommandSources()` 合併三類來源
4. 再與 `existingCommands` 合併成 catalog
5. 使用者可在 command 清單中看到 `skill:*`

## 5. Conflict and Error Handling

### 5.1 Empty input

- 無 `loadedSkills` 或空陣列 -> 不產生 skill commands
- 屬正常情況，不拋錯

### 5.2 Invalid entries

- 單筆 skill 缺 `name` -> 略過並記 warning
- 單筆 skill 缺 `description` -> fallback 為 skill 名稱
- 此層不驗證 template 對應的 skill runtime 是否可成功執行

### 5.3 Name conflicts

- `SkillCommandSource` 內若產生重複 `skill:<name>` -> 保留第一個並記 warning
- 若與既有 command 或其他 source 衝突 -> 保留先出現者並記 warning

### 5.4 Safety

- skill source 僅做記憶體資料轉換
- 不讀檔、不 discovery、不執行實際 skill

## 6. Testing Strategy

### 6.1 Unit tests

- `SkillCommandSource`
  - 正常把 skill 轉成 `skill:<name>`
  - `description` fallback
  - 缺 `name` 時略過並 warning
  - 重複 skill 名稱時保留第一個

### 6.2 Integration tests

- `createCommandInjectHooks()` 在有 `loadedSkills` 時會把 `skill:*` 注入 catalog
- 與既有 command 衝突時不覆蓋且有 warning
- 與 Makefile / package scripts 可同時存在

### 6.3 Manual verification

- 以 fixture 或測試 stub 傳入 `loadedSkills`
- 確認輸出 catalog 含 `skill:*`
- 觸發 command 時確認模板保留 `$ARGUMENTS`

## 7. Rollout Plan

1. 擴充 types 與 plugin options
2. 新增 `SkillCommandSource` 與單元測試
3. 接線到 `createCommandInjectHooks()`
4. 補 plugin 整合測試
5. 更新文件，說明 skill commands 需由外部傳入 loaded skills
