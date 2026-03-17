# release-please 自動化發布設計

## 概述

引入 release-please 工具，實現自動化版號管理與發布流程。建立 Release PR 機制，保留人工審核點，同時減少手動操作。

## 現況分析

- **分支策略**: main 分支發布
- **Commit 格式**: Conventional Commits (feat:, fix:, BREAKING CHANGE:)
- **套件管理**: Bun
- **當前發布流程**: 手動修改 version → git tag v* → workflow 觸發發布

## 目標

1. 自動化版號判斷與 CHANGELOG 生成
2. 透過 Release PR 保留人工審核點
3. 與現有 GitHub Actions 整合

## 設計方案

### 運作流程

```
開發者 push → release-please workflow → 建立/更新 Release PR
                                    ↓
                              維護者 review
                                    ↓
                              merge Release PR
                                    ↓
                              release-please 建立 tag + GitHub Release
                                    ↓
                              現有 release workflow 觸發 → 發布到 npm
```

### 新增檔案

#### 1. release-please-config.json

```json
{
  "packages": {
    ".": {
      "release-type": "node"
    }
  }
}
```

#### 2. .github/workflows/release-please.yml

```yaml
name: release-please

on:
  push:
    branches:
      - main

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: google-github-actions/release-please-action@v4
        with:
          config-file: release-please-config.json
          default-branch: main
```

#### 3. 修改 .github/workflows/release.yml

觸發條件從 git tag 改為 release 事件（release-please 建立 Release 時觸發）：

```yaml
on:
  release:
    types: [published]
```

### 版號判斷規則

| Commit 類型 | 版號變更 |
| ----------- | -------- |
| `fix:` | patch (0.1.0 → 0.1.1) |
| `feat:` | minor (0.1.0 → 0.2.0) |
| `feat: xxx` + `BREAKING CHANGE:` | major (0.1.0 → 1.0.0) |

## 風險與緩解

| 風險 | 緩解措施 |
| ---- | -------- |
| commit message 格式錯誤導致版號判斷錯誤 | Release PR 提供人工審核點 |
| 首次設置需初始化 | release-please 會自動建立 initial PR |
| 與現有 tag 流程衝突 | 移除手動 git tag，改用 release-please 建立的 tag |

## 實施步驟

1. 建立 release-please-config.json
2. 建立 .github/workflows/release-please.yml
3. 修改 .github/workflows/release.yml 觸發條件
4. 推送設定並驗證 Release PR 生成
5. 第一次 merge 測試完整流程

## 驗證標準

- [ ] push 到 main 分支後自動產生 Release PR
- [ ] Release PR 包含正確的版號建議和 changelog
- [ ] merge Release PR 後自動建立 GitHub Release
- [ ] GitHub Release 觸發 npm publish workflow
- [ ] 套件成功發布到 npm registry
