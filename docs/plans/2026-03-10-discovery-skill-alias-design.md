# OpenCode Plugin Design: discovery-based skill aliases

Date: 2026-03-10
Status: Approved

Plugin Name: `opencode-command-inject`

## Goal

讓 `opencode-command-inject` 直接發現本機與專案中的 skills 目錄，讀取每個 skill 的 `SKILL.md`，並產生 `skill:<name>` commands，與既有 Makefile/package script commands 一起注入 OpenCode。

## Scope

### In scope

- discovery-based skills 載入
- `SKILL.md` frontmatter + body 解析
- 產生 `skill:<name>` aliases
- 與 Makefile / package scripts 共存
- 既有衝突策略與 execute flow 沿用

### Out of scope

- 依賴 runtime `client.app.skills()`
- 修改 OpenCode core skill loading
- 直接執行 skill runtime protocol

## Discovery Order

依序搜尋以下目錄，先出現者優先：

1. `.opencode/skills`
2. `~/.config/opencode/skills`
3. `.claude/skills`
4. `.agents/skills`
5. `~/.claude/skills`
6. `~/.agents/skills`

若同名 skill 在多處存在，保留優先序較高者，後續重複項目記 warning。

## Skill File Model

每個 skill 來源預期為：

- `<skills-dir>/<skill-name>/SKILL.md`

`SKILL.md` 解析規則：

- frontmatter: 讀取 `name`、`description` 等 metadata
- body: 作為 skill 指令主體

## Command Mapping

discovery loader 會把 skill 轉成既有 `LoadedSkillCommandInput`，再交給 `SkillCommandSource`：

- `name`: frontmatter `name`，若缺則 fallback 為目錄名稱
- `description`: frontmatter `description`，若缺則 fallback 為 skill 名稱
- `template`: 以 skill body 包裝成

```txt
<skill-instruction>
<skill body>
</skill-instruction>

<user-request>
$ARGUMENTS
</user-request>
```

`SkillCommandSource` 繼續負責：

- 輸出 `skill:<name>`
- 名稱正規化
- 去重與 warning
- execute template flow

## Architecture

- `src/skills/frontmatter.ts`: 解析 `SKILL.md`
- `src/skills/discovery.ts`: 搜尋目錄與優先序
- `src/skills/load-skill.ts`: 將單一 `SKILL.md` 轉為 `LoadedSkillCommandInput`
- `src/plugin.ts`: 啟動時 discovery skills，交給 `createCommandInjectHooks()`
- `src/command-sources/skill-source.ts`: 保持純轉換責任

## Error Handling

- 目錄不存在：跳過
- 缺 `SKILL.md`：跳過
- frontmatter 解析失敗：warning + 跳過
- body 空白：warning + 跳過
- 同名 skill：保留優先序較高者 + warning

## Testing Strategy

- `src/skills/frontmatter.test.ts`
- `src/skills/discovery.test.ts`
- `src/plugin.test.ts`
- 保留既有 `src/plugin/command-inject.test.ts` 與 `src/command-sources/skill-source.test.ts`

## Documentation

- README 改成 discovery-based skills loader
- `docs/commands.md` 說明 `skill:*` 來自 skills discovery
