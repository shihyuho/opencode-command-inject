# Command Inject Plugin for OpenCode

![Version](https://img.shields.io/npm/v/opencode-command-inject)

Auto-inject project commands into OpenCode. Finds `Makefile` targets, `package.json` scripts, and local skills at startup.

## Prerequisites

- [OpenCode CLI](https://opencode.ai) installed
- A project with `Makefile`, `package.json`, or local skills

## Installation

Add the plugin to your OpenCode config (`~/.config/opencode/opencode.json`):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-command-inject@latest"]
}
```

## Usage

The plugin scans your project at startup and injects commands from multiple sources. Type `/` in OpenCode to see and run them.

Commands are loaded from pluggable sources ([command-sources](src/command-sources)). Each source reads a specific file format and transforms it into OpenCode commands with consistent naming and templates.

By default, generated names stay the same. You only change naming when you add `command_name_prefix` config.

### Makefile

Reads `Makefile` targets and exposes them as `make:<target>` commands.

Supports `target: ## description` syntax for descriptions. Without description, uses the target name.

**Example:**

```makefile
build: ## Build the project
	bun run build
```
→ command: `/make:build` with description "Build the project"

### NPM Scripts

Reads `scripts` from `package.json` and exposes them as `<runner>:<script>` commands.

Runner is auto-detected: checks `packageManager` field first, then lockfiles (`pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`, `bun.lock`, `package-lock.json`), falls back to `npm`.

**Example:** in a pnpm project:

```json
{
  "scripts": {
    "dev": "vite"
  }
}
```

→ command: `/pnpm:dev`

### Skills

Discovers local skills from these directories (first match wins):

1. `.opencode/skills`
2. `~/.config/opencode/skills`
3. `.claude/skills`
4. `.agents/skills`
5. `~/.claude/skills`
6. `~/.agents/skills`

Skills are exposed as `skill:<name>` commands. Each skill expects `SKILL.md` in `<skill-dir>/<skill-name>/`.

**Example:** `.agents/skills/review/SKILL.md` → command: `/skill:review`

## Configuration

You can customize each source via configuration file. See [docs/configuration.md](docs/configuration.md) for detailed documentation.

Quick examples:

```jsonc
{
  "$schema": "https://unpkg.com/opencode-command-inject/opencode-command-inject.schema.json",
  "command_name_prefix": {
    "disable": true
  },
  "sources": {
    "skill": {
      "command_name_prefix": {
        "disable": false,
        "value": "coach"
      }
    },
    "makefile": {
      "command_name_prefix": {
        "disable": false,
        "value": "maker"
      }
    }
  }
}
```

Top-level `command_name_prefix.disable: true` turns off generated prefixes globally. A source can force prefixes back on and optionally rename them with `sources.<source>.command_name_prefix.value`.

If a custom prefix creates a collision, the plugin falls back to the canonical source-prefixed name and logs a warning.

## Development

```bash
git clone https://github.com/shihyuho/opencode-command-inject.git
cd opencode-command-inject
bun install
```

Link locally in your OpenCode config:

```json
{
  "plugin": ["file:///path/to/opencode-command-inject"]
}
```

## License

MIT
