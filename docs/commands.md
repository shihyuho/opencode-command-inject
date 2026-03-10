# Commands

## Startup Dynamic Commands

- `make:<target>`
  - source: 專案根目錄 `Makefile`
  - description: `##` 註解或 target 名稱
  - template: `make <target> $ARGUMENTS`

- `npm:<script>`
  - source: 專案根目錄 `package.json` `scripts`
  - description: script 名稱
  - template: `npm run <script> -- $ARGUMENTS`

- `skill:<name>`
  - source: 外部傳入的 `loadedSkills`
  - description: `description`，若未提供則 fallback 為正規化後、去除 `skill:` 前綴的 skill 名稱
  - template: 使用傳入的 template，並保留 `$ARGUMENTS` 代換

## External Skill Injection

- 這個套件不會自行 discovery skills。
- 若要注入 skill commands，請建立 wrapper plugin，並在其中使用 `createCommandInjectPlugin({ loadedSkills })`。
- skill 名稱會正規化成 `skill:<name>`；若傳入 `skill:greet` 或 `skill: greet`，最終都會變成 `skill:greet`。

## Conflict Policy

- 若與既有 command 同名，保留先出現者，不覆蓋。
- 來源衝突與覆蓋事件皆記錄 warning。
