# Commands

## Startup Dynamic Commands

- `make:<target>`
  - source: 專案根目錄 `Makefile`
  - description: `##` 註解或 target 名稱
  - template: `make <target> $ARGUMENTS`

- `<runner>:<script>`
  - source: 專案根目錄 `package.json` `scripts`
  - description: script 名稱
  - template: `<runner> run <script> -- $ARGUMENTS`

- `skill:<name>`
  - source: discovery 到的 skills 目錄，或相容模式下外部傳入的 `loadedSkills`
  - alias 名稱：
    - discovery 模式：優先使用 `SKILL.md` frontmatter 的 `name`，若未提供則 fallback 為目錄名稱
    - 相容模式：使用外部傳入的 `name`
  - description:
    - discovery 模式：`SKILL.md` frontmatter 的 `description`，若未提供則 fallback 為 skill 名稱
    - 相容模式：外部傳入的 `description`，若未提供則 fallback 為正規化後 skill 名稱
  - template:
    - discovery 模式：由 `SKILL.md` body 包裝成 `<skill-instruction>` / `<user-request>` 模板
    - 相容模式：使用傳入的 template，並保留 `$ARGUMENTS` 代換

## Skill Discovery

- 預設會依下列優先序 discovery skills：
  1. `.opencode/skills`
  2. `~/.config/opencode/skills`
  3. `.claude/skills`
  4. `.agents/skills`
  5. `~/.claude/skills`
  6. `~/.agents/skills`
- 每個 skill 來源預期為 `<skills-dir>/<skill-name>/SKILL.md`
- 若同名 skill 在不同目錄出現，保留優先序最高者，其餘跳過並記 warning（包含來源路徑）
- 缺目錄或缺 `SKILL.md` 時直接跳過

## Compatibility Mode

- 仍可透過 `createCommandInjectPlugin({ loadedSkills })` 手動注入 skills。
- 提供 `loadedSkills` 時，預設不做 discovery，以保留舊 wrapper plugin 行為。
- 若要同時使用手動與 discovery skills，可設定 `createCommandInjectPlugin({ loadedSkills, discoverSkills: true })`。
- 在 mixed mode 下，若手動 skill 與 discovery skill 同名，保留手動版本，discovery 項目跳過並記 warning。

## Conflict Policy

- 若與既有 command 同名，保留先出現者，不覆蓋。
- 來源衝突與覆蓋事件皆記錄 warning。
