# Command Inject Config Feature Design

## Overview

Add configuration file support for command-sources in opencode-command-inject plugin.

## Goals

- Allow users to configure each command-source via config file
- Provide fallback to default values when config is missing
- Support variable substitution in prompt templates

## Configuration File

### Location (Priority Order)

1. **Environment variable**: `OPENCODE_COMMAND_INJECT_CONFIG` (absolute path)
2. **User config**: `~/.config/opencode/opencode-command-inject.jsonc` (or `.json`)
3. **Project config**: `<directory>/.opencode/opencode-command-inject.jsonc` (or `.json`)

If `OPENCODE_COMMAND_INJECT_CONFIG` points to a non-existent file, falls back to default paths.

### Format

- Prefer `.jsonc` (JSON with comments), fallback to `.json`
- Project config overrides user config (deep merge)
- Environment variable takes precedence over all default paths

### Configuration Structure

```json
{
  "sources": {
    "makefile": {
      "enabled": true,
      "prompt": "...",
      "prompt_append": "..."
    },
    "npm-scripts": {
      "enabled": true,
      "prompt": "...",
      "prompt_append": "..."
    },
    "skill": {
      "enabled": true,
      "prompt": "...",
      "prompt_append": "..."
    }
  }
}
```

### Source Options

| Option         | Type    | Default                      | Description                                    |
|----------------|---------|------------------------------|------------------------------------------------|
| `enabled`      | boolean | `true`                       | Whether this source is active                 |
| `prompt`       | string  | (see Default Prompts)       | Override prompt template                       |
| `prompt_append`| string  | `""`                         | Append to prompt template                      |

### Default Prompts

**makefile:**
```
Use shell to execute `make <target> $ARGUMENTS`
```

**npm-scripts:**
```
Use shell to execute `<runner> run <script> -- $ARGUMENTS`
```

**skill:**
```
<skill-instruction>
{body content}
</skill-instruction>

<user-request>
$ARGUMENTS
</user-request>
```

Note: The skill default prompt uses the skill's raw `body` content (from frontmatter), not the wrapped `template`.

## Variable Substitution

The `prompt` and `prompt_append` fields support variable substitution. Variables are replaced with actual values at runtime.

### All Sources

| Variable        | Example                | Description              |
|-----------------|-----------------------|-------------------------|
| `{name}`        | `build` / `dev`       | Command name            |
| `{description}` | `Build the project`   | Command description    |
| `{arguments}`   | `$ARGUMENTS`          | User arguments         |

### makefile / npm-scripts Only

| Variable    | Example        | Description      |
|-------------|----------------|------------------|
| `{command}` | `make build`  | Full command     |

### skill Only

| Variable       | Example                     | Description              |
|----------------|----------------------------|-------------------------|
| `{instruction}` | Raw skill body content     | Skill's raw instruction (from frontmatter, without wrapper) |

Note: `{instruction}` uses the skill's `body` field (raw content from SKILL.md frontmatter), NOT the `template` field (which includes the `<skill-instruction>` wrapper).

### Example

```json
{
  "sources": {
    "makefile": {
      "prompt": "Execute: {name}\n{command} {arguments}"
    }
  }
}
```

For Makefile target `build`, this produces:
```
Execute: build
make build $ARGUMENTS
```

## Implementation

### File Structure

```
src/
  config/
    index.ts              # Export loadPluginConfig
    loader.ts             # Loading logic with env var support
    schema.ts             # Zod schema + JSON Schema generation
    types.ts              # Type definitions
    strip-json-comments.ts # JSONC comment stripping utility
  command-sources/
    types.ts              # SourceConfig, LoadedSkillCommandInput (with body field)
    variable-substitution.ts # Shared variable substitution utility
    skill-source.ts       # Supports config, uses body for {instruction}
    makefile-source.ts    # Supports config
    npm-scripts-source.ts # Supports config
  skills/
    types.ts              # LoadedSkillDefinition (with body field)
    load-skill.ts         # Returns body from frontmatter
  plugin/
    command-inject.ts     # Integrates config with sources
```

### Config Loader

Reference: `oh-my-opencode-slim` config loader

- Search for config files in priority order:
  1. `OPENCODE_COMMAND_INJECT_CONFIG` env var (absolute path)
  2. User config: `${XDG_CONFIG_HOME}/opencode/opencode-command-inject.jsonc`
  3. Project config: `${project}/.opencode/opencode-command-inject.jsonc`
- Support both .jsonc and .json (jsonc takes precedence)
- Deep merge: project config overrides user config
- If env var points to non-existent file, falls back to default paths

### Source Classes Modification

Each `CommandSource` accepts optional config:

```typescript
interface SourceConfig {
  enabled?: boolean
  prompt?: string
  prompt_append?: string
}

class MakefileCommandSource {
  constructor(config?: SourceConfig) { ... }
}
```

### Plugin Integration

```typescript
const config = loadPluginConfig(ctx.directory)

const dynamicSources: CommandSource[] = []
if (config.sources?.makefile?.enabled !== false) {
  dynamicSources.push(new MakefileCommandSource(config.sources?.makefile))
}
```

## JSON Schema

- Generate `opencode-command-inject.schema.json` using Zod
- Include `$schema` field in config for editor validation and autocomplete
- Published at: `https://unpkg.com/opencode-command-inject/opencode-command-inject.schema.json`

## Backward Compatibility

- All config options are optional
- Missing config falls back to default behavior
- Existing functionality unchanged when no config file present
- Environment variable is optional; if not set, uses default paths
