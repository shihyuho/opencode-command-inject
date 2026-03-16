# Configuration

This document describes how to configure the command-inject plugin.

## Configuration File Location

The plugin loads configuration from:

- **User config**: `~/.config/opencode/command-inject.jsonc` (or `.json`)
- **Project config**: `<directory>/.opencode/command-inject.jsonc` (or `.json`)

The plugin supports both `.jsonc` (JSON with comments) and `.json` formats. `.jsonc` is preferred if both exist.

Project config takes precedence over user config (deep merge).

## Configuration Structure

```jsonc
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

## Source Options

| Option         | Type    | Default | Description                                    |
|----------------|---------|---------|-----------------------------------------------|
| `enabled`      | boolean | `true`  | Enable or disable this source                 |
| `prompt`       | string  | (see below) | Custom prompt template                  |
| `prompt_append`| string  | `""`    | Text to append to the prompt template         |

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
{skill content}
</skill-instruction>

<user-request>
$ARGUMENTS
</user-request>
```

## Variable Substitution

The `prompt` option supports variable substitution. Variables are replaced with actual values at runtime.

### All Sources

| Variable        | Description                     |
|-----------------|--------------------------------|
| `{name}`        | Command/script/skill name       |
| `{description}` | Description                     |
| `{arguments}`   | User-provided arguments (`$ARGUMENTS`) |

### makefile / npm-scripts Only

| Variable    | Description         |
|-------------|--------------------|
| `{command}` | Full command       |

### skill Only

| Variable       | Description         |
|----------------|--------------------|
| `{instruction}` | Skill content/prompt |

## Examples

### Disable a Source

```jsonc
{
  "sources": {
    "npm-scripts": {
      "enabled": false
    }
  }
}
```

### Custom Prompt for Makefile

```jsonc
{
  "sources": {
    "makefile": {
      "prompt": "Execute {name}: {command} {arguments}"
    }
  }
}
```

For Makefile target `build`, this produces:
```
Execute build: make build $ARGUMENTS
```

### Append to Prompt

```jsonc
{
  "sources": {
    "makefile": {
      "prompt_append": "\n\nNote: This command may take a while"
    }
  }
}
```

### Full Example

```jsonc
{
  "$schema": "https://unpkg.com/opencode-command-inject/command-inject.schema.json",
  "sources": {
    "makefile": {
      "enabled": true,
      "prompt": "Run {name}: {command} {arguments}"
    },
    "npm-scripts": {
      "enabled": true,
      "prompt_append": "\n\nNote: Use npm-scripts to run this"
    },
    "skill": {
      "enabled": false
    }
  }
}
```

## JSON Schema

The configuration is validated against a JSON Schema. Include the `$schema` field in your config file for editor validation and autocomplete.

```jsonc
{
  "$schema": "https://unpkg.com/opencode-command-inject/command-inject.schema.json",
  ...
}
```

The schema is published with the npm package and available at:
- https://unpkg.com/opencode-command-inject/command-inject.schema.json
