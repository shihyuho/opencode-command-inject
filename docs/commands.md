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

## Conflict Policy

- 若與既有 command 同名，保留先出現者，不覆蓋。
- 來源衝突與覆蓋事件皆記錄 warning。
