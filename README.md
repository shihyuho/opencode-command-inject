# Command Inject Plugin for OpenCode

![Version](https://img.shields.io/npm/v/opencode-command-inject)

**Auto-inject project commands into OpenCode.** 

`opencode-command-inject` finds `Makefile` targets, `package.json` scripts, and discovered local skills at startup.

## Prerequisites

- [OpenCode CLI](https://opencode.ai) installed.
- A project with a `Makefile`, `package.json`, discoverable skills, or any combination of them.

## Installation

Add the plugin to your OpenCode configuration file (`~/.config/opencode/opencode.json` or similar):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-command-inject@latest"]
}
```


## Usage

Once installed, the plugin will automatically scan your project's root directory during OpenCode's startup phase.

You can view and execute these commands by typing `/` in the OpenCode CLI.

By default, the plugin also discovers skills from local skill directories and exposes them as `skill:<name>` commands.

Discovery order (highest priority first):

1. `.opencode/skills`
2. `~/.config/opencode/skills`
3. `.claude/skills`
4. `.agents/skills`
5. `~/.claude/skills`
6. `~/.agents/skills`

If the same skill name exists in multiple directories, the highest-priority one wins and the others are skipped with a warning.

Each discovered skill is expected at `<skills-dir>/<skill-name>/SKILL.md`.

If you still need to inject skills manually, you can create a small wrapper plugin with the exported factory:

```ts
// command-inject-with-skills.ts
import { createCommandInjectPlugin } from "opencode-command-inject"

export default createCommandInjectPlugin({
  loadedSkills: [
    {
      name: "review",
      description: "Run review workflow",
      template: "Use skill review $ARGUMENTS"
    }
  ]
})
```

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["file:///path/to/command-inject-with-skills.ts"]
}
```

### Dynamic Command Naming Rules

- **Makefile** targets -> `make:<target>`
- **package.json** scripts -> `<runner>:<script>` where runner is one of `npm`, `pnpm`, `yarn`, `bun`
- **Discovered skills** -> `skill:<name>`

Runner detection priority:

1. `package.json` `packageManager` field (for example `pnpm@10.0.0`)
2. Lockfiles in project root (`pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`, `bun.lock`, `package-lock.json`)
3. Fallback to `npm`

### Description Rules

- **Makefile**: Prioritizes `target: ## <description>` syntax, falling back to the target name if no description is provided.
- **Package scripts**: Uses the script name.
- **Discovered skills**: Uses `description` from `SKILL.md` frontmatter when provided, otherwise falls back to the skill name.

### Template Generation

The plugin maps the commands automatically to the prompt input template:

- **Makefile**: `Use shell to execute \`make <target> $ARGUMENTS\``
- **Package scripts**: `Use shell to execute \`<runner> run <script> -- $ARGUMENTS\``
- **Discovered skills**: Wraps the `SKILL.md` body as:

  - `<skill-instruction>...</skill-instruction>`
  - blank line
  - `<user-request>$ARGUMENTS</user-request>`

- **Manual loaded skills**: Uses the provided template and preserves `$ARGUMENTS` substitution.

## Plugin Behavior

- **Startup Only**: Commands are loaded only during startup (no hot reloading).
- **Graceful Skipping**: Skips silently if a `Makefile` or `package.json` is missing without interrupting the startup sequence.
- **Discovery-Based Skills**: Skill commands are created automatically from discovered `SKILL.md` files.
- **Compatibility Mode**: `createCommandInjectPlugin({ loadedSkills })` still works for manual injection.
- **Compatibility Default**: When `loadedSkills` are provided manually, discovery is disabled by default to preserve older wrapper-plugin behavior.
- **Mixed Mode**: Set `createCommandInjectPlugin({ loadedSkills, discoverSkills: true })` if you want both manual and discovered skills; manually provided skills take precedence over discovered skills with the same name.
- **Conflict Resolution**: Uses a conservative strategy for naming conflicts. Retains the first appearing command and logs a warning for any duplicates.

## Development

To develop on this plugin locally:

1. **Clone**:

   ```bash
   git clone https://github.com/shihyuho/opencode-command-inject.git
   cd opencode-command-inject
   bun install
   ```

2. **Link**:
   Update your OpenCode config to point to your plugin root directory using a `file://` URL:

   ```json
   {
     "plugin": ["file:///path/to/opencode-command-inject"]
   }
   ```

## License

MIT
