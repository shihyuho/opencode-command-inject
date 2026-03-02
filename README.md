# Command Inject Plugin for OpenCode

![Version](https://img.shields.io/npm/v/opencode-command-inject)

**Auto-inject project commands into OpenCode.** 

`opencode-command-inject` finds `Makefile` targets and `package.json` scripts at startup and injects them into the `/` menu for one-step execution.

## Prerequisites

- [OpenCode CLI](https://opencode.ai) installed.
- A project with a `Makefile` or `package.json`.

## Installation

Add the plugin to your OpenCode configuration file (`~/.config/opencode/opencode.json` or similar):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-command-inject@latest"]
}
```

> [!NOTE]
> Ensure you have built the plugin (`pnpm run build`) before starting OpenCode if you are using it locally.

## Usage

Once installed, the plugin will automatically scan your project's root directory during OpenCode's startup phase.

You can view and execute these commands by typing `/` in the OpenCode CLI.

### Dynamic Command Naming Rules

- **Makefile** targets -> `make:<target>`
- **package.json** scripts -> `<runner>:<script>` where runner is one of `npm`, `pnpm`, `yarn`, `bun`

Runner detection priority:

1. `package.json` `packageManager` field (for example `pnpm@10.0.0`)
2. Lockfiles in project root (`pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`, `bun.lock`, `package-lock.json`)
3. Fallback to `npm`

### Description Rules

- **Makefile**: Prioritizes `target: ## <description>` syntax, falling back to the target name if no description is provided.
- **Package scripts**: Uses the script name.

### Template Generation

The plugin maps the commands automatically to the prompt input template:

- **Makefile**: `Use shell to execute \`make <target> $ARGUMENTS\``
- **Package scripts**: `Use shell to execute \`<runner> run <script> -- $ARGUMENTS\``

## Plugin Behavior

- **Startup Only**: Commands are loaded only during startup (no hot reloading).
- **Graceful Skipping**: Skips silently if a `Makefile` or `package.json` is missing without interrupting the startup sequence.
- **Conflict Resolution**: Uses a conservative strategy for naming conflicts. Retains the first appearing command and logs a warning for any duplicates.

## Building and Updating

OpenCode does not automatically update plugins. To update to the latest version or apply local changes, you must rebuild or clear the cached plugin:

```bash
# Rebuild the plugin
pnpm run build

# Run OpenCode to trigger the new plugin version
opencode
```

## Development

To develop on this plugin locally:

1. **Clone**:

   ```bash
   git clone https://github.com/shihyuho/opencode-command-inject.git
   cd opencode-command-inject
   pnpm install
   ```

2. **Build**:

   ```bash
   pnpm run build
   ```

3. **Link**:
   Update your OpenCode config to point to your local `.opencode/plugins` build directory or your plugin root directory using a `file://` URL:

   ```json
   {
     "plugin": ["file:///path/to/opencode-command-inject"]
   }
   ```

## License

MIT
