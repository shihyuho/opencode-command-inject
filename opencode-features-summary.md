# OpenCode 功能分析總結

## 任務一：Skills 注入成 Commands

### 功能說明
在 opencode 啟動時，將載入的 skills 注入成 commands，用戶可以在 opencode 中輸入 `/` 來選擇 skills。

### 相關檔案

| 檔案路徑 | 說明 |
|---------|------|
| `~/code-yeongyu/oh-my-opencode/src/index.ts` | 插件入口，await `createTools` 後，將 `mergedSkills`/`availableSkills` 傳入 `createHooks` |
| `~/code-yeongyu/oh-my-opencode/src/create-hooks.ts` | 將 skill metadata 傳入 `createSkillHooks` |
| `~/code-yeongyu/oh-my-opencode/src/plugin/hooks/create-skill-hooks.ts` | 當 auto-slash-command hook 啟用時，实例化 `createAutoSlashCommandHook({ skills: mergedSkills })` |
| `~/code-yeongyu/oh-my-opencode/src/hooks/auto-slash-command/executor.ts` | 透過 `skillToCommandInfo` 將所有 skills 轉換為命令，合併到命令目錄中 |
| `~/code-yeongyu/oh-my-opencode/src/hooks/auto-slash-command/hook.ts` | 監聽以 `/` 開頭的訊息，解析 slash token 並注入模板 |
| `~/code-yeongyu/oh-my-opencode/src/features/opencode-skill-loader/loaded-skill-from-path.ts` | 將 `SKILL.md` 解析為 `CommandDefinition` |
| `~/code-yeongyu/oh-my-opencode/src/features/opencode-skill-loader/skill-definition-record.ts` | `skillsToCommandDefinitionRecord` 將 skill 轉換為 openCode 相容的 command 結構 |

### 核心邏輯

1. **Skill 載入與轉換**
   - `discoverAllSkills()` 發現所有可用的 skills
   - `skillToCommandInfo` 將每個 skill 轉換為 command 格式
   - `skillsToCommandDefinitionRecord` 將 skill 轉換為 `CommandDefinition` 結構

2. **命令目錄建構** (`executor.ts`)
   ```ts
   const skills = options?.skills ?? await discoverAllSkills()
   const skillCommands = skills.map(skillToCommandInfo)
   return [
     ...builtinCommands,
     ...opencodeProjectCommands,
     ...projectCommands,
     ...opencodeGlobalCommands,
     ...userCommands,
     ...skillCommands,
   ]
   ```

3. **Skill 模板格式** (`loaded-skill-from-path.ts`)
   ```ts
   const templateContent = `<skill-instruction>…${resolvedBody}</skill-instruction>
   
   <user-request>
   $ARGUMENTS
   </user-request>`
   ```

---

## 任務二：`!` 執行 Shell 命令

### 功能說明
在 opencode 中輸入 `!` 開頭的訊息，會作為 shell 命令執行。

### 相關檔案

| 檔案路徑 | 說明 |
|---------|------|
| `/Users/matt/tmp/opencode/packages/app/src/components/prompt-input.tsx` | 前端輸入框邏輯，監聽 `!` keypress |
| `/Users/matt/tmp/opencode/packages/app/src/components/prompt-input/submit.ts` | 提交邏輯，處理 shell 模式提交 |
| `/Users/matt/tmp/opencode/packages/opencode/src/server/routes/session.ts` | Server 端 API，執行 shell 命令 |

### 核心邏輯

#### 1. 輸入模式切換 (`prompt-input.tsx`)

- **State 定義**（第 238-254 行）
  ```ts
  const [store, setStore] = createStore<{
    // ...
    mode: "normal" | "shell"
    // ...
  }>({
    mode: "normal",
    // ...
  })
  ```

- **Key 監聽**（第 1005-1013 行）
  ```ts
  if (event.key === "!" && store.mode === "normal") {
    const cursorPosition = getCursorPosition(editorRef)
    if (cursorPosition === 0) {
      setStore("mode", "shell")
      setStore("popover", null)
      event.preventDefault()
      return
    }
  }
  ```

- **Escape 退出 shell 模式**（第 1015-1028 行）
  ```ts
  if (event.key === "Escape") {
    if (store.mode === "shell") {
      setStore("mode", "normal")
      event.preventDefault()
      event.stopPropagation()
      return
    }
  }
  ```

#### 2. Shell 模式提交 (`submit.ts`)

- **Shell 模式處理**（第 240-257 行）
  ```ts
  if (mode === "shell") {
    clearInput()
    client.session
      .shell({
        sessionID: session.id,
        agent,
        model,
        command: text,  // 用戶輸入的 shell 命令
      })
      .catch((err) => {
        showToast({...})
        restoreInput()
      })
    return
  }
  ```

#### 3. Server API (`session.ts`)

- **API 端點**（第 844 行）
  - `POST /session/:id/shell` - 執行 shell 命令
  - Request body: `{ agent, model?, command }`
  - Response: `{ info: Message, parts: Part[] }`

### 流程總結

1. 用戶在輸入框開頭輸入 `!`
2. `prompt-input.tsx` 監聽 `!` keypress，切換 `store.mode` 為 `"shell"`
3. 輸入框樣式變更為等寬字體 (`font-mono`)
4. 用戶輸入 shell 命令（如 `ls -la`）並按 Enter
5. `submit.ts` 檢測到 `mode === "shell"`，調用 `client.session.shell()`
6. 請求發送到 server 端 `/session/:id/shell` API
7. Server 執行 shell 命令並返回結果
8. 結果顯示在對話中
