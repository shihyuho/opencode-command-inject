# Command Inject Config Feature Design

## Overview

Add configuration file support for command-sources in opencode-command-inject plugin.

## Goals

- Allow users to configure each command-source via config file
- Provide fallback to default values when config is missing
- Support variable substitution in prompt templates

## Configuration File

### Location

- **User config**: `~/.config/opencode/command-inject.jsonc` (or `.json`)
- **Project config**: `<directory>/.opencode/command-inject.jsonc` (or `.json`)

### Format

- Prefer `.jsonc` (JSON with comments), fallback to `.json`
- Project config overrides user config (deep merge)

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
| `prompt`       | string  | (existing logic)             | Override prompt template                       |
| `prompt_append`| string  | `""`                         | Append to prompt template                      |

## Variable Substitution

The `prompt` field supports variable substitution. Variables are replaced with actual values at runtime.

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
| `{instruction}` | `Use when building...`     | Skill prompt/body       |

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
    index.ts        # Export loadConfig
    loader.ts       # Loading logic
    schema.ts       # Zod schema + JSON Schema
    types.ts        # Type definitions
```

### Config Loader

Reference: `oh-my-opencode-slim` config loader

- Search for config files in order
- Support both .jsonc and .json
- Deep merge: project config overrides user config

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

- Generate `command-inject.schema.json`
- Publish with npm package

## Backward Compatibility

- All config options are optional
- Missing config falls back to default behavior
- Existing functionality unchanged when no config file present
