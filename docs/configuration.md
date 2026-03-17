# Configuration

This document describes how to configure the command-inject plugin.

## Configuration File Location

The plugin loads configuration in the following priority:

1. **Environment variable**: If `OPENCODE_COMMAND_INJECT_CONFIG` is set (absolute path), use ONLY this file
2. **User config + Project config**: If no environment variable, merge user and project configs (project takes precedence)

The plugin supports both `.jsonc` (JSON with comments) and `.json` formats. `.jsonc` is preferred if both exist.

### Environment Variable

Set `OPENCODE_COMMAND_INJECT_CONFIG` to an absolute path to use a custom config file:

```bash
export OPENCODE_COMMAND_INJECT_CONFIG="/path/to/your/config.jsonc"
```

When set, this takes exclusive precedence - user and project configs are ignored.

This is useful for:
- Testing different configurations
- Using a shared config across projects
- CI/CD environments

## Configuration Structure

```jsonc
{
  "sources": {
    "makefile": {
      "disable": false,
      "prompt": "...",
      "prompt_append": "..."
    },
    "npm-scripts": {
      "disable": false,
      "prompt": "...",
      "prompt_append": "..."
    },
    "skill": {
      "disable": false,
      "prompt": "...",
      "prompt_append": "..."
    }
  }
}
```

## Source Options

| Option         | Type    | Default | Description                                    |
|----------------|---------|---------|-----------------------------------------------|
| `disable`      | boolean | `false` | Set to `true` to disable this source         |
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
      "disable": true
    }
  }
}
```

### Custom Prompt for Makefile

```jsonc
{
  "sources": {
    "makefile": {
      "disable": false,
      "prompt": "Run {name}: {command} {arguments}"
    },
    "npm-scripts": {
      "disable": false,
      "prompt_append": "\n\nNote: Use npm-scripts to run this"
    },
    "skill": {
      "disable": true
    }
  }
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
  "$schema": "https://unpkg.com/opencode-command-inject/opencode-command-inject.schema.json",
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
  "$schema": "https://unpkg.com/opencode-command-inject/opencode-command-inject.schema.json",
  ...
}
```

The schema is published with the npm package and available at:
- https://unpkg.com/opencode-command-inject/opencode-command-inject.schema.json
