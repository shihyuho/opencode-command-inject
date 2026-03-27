# Configuration

This document is the authoritative contract for `command_name_prefix`.

## Load order

Configuration files are loaded in this order:

1. `OPENCODE_COMMAND_INJECT_CONFIG` if set
2. User config:
   - `${XDG_CONFIG_HOME}/opencode/opencode-command-inject.jsonc`
   - `${XDG_CONFIG_HOME}/opencode/opencode-command-inject.json`
   - If `XDG_CONFIG_HOME` is unset, use `~/.config/opencode/` instead
3. Project config (merged on top):
   - `.opencode/opencode-command-inject.jsonc`
   - `.opencode/opencode-command-inject.json`

At each non-env location, `.jsonc` is checked before `.json`.

## Configuration structure

```jsonc
{
  "command_name_prefix": {
    "disable": false
  },
  "sources": {
    "makefile": {
      "disable": false,
      "prompt": "...",
      "prompt_append": "...",
      "command_name_prefix": {
        "disable": false,
        "value": "maker"
      }
    },
    "npm-scripts": {
      "disable": false,
      "command_name_prefix": {
        "disable": true
      }
    },
    "skill": {
      "disable": false,
      "command_name_prefix": {
        "disable": false,
        "value": "coach"
      }
    }
  }
}
```

## Prefix precedence

1. Default behavior keeps source prefixes enabled.
2. Top-level `command_name_prefix.disable: true` disables prefixes globally.
3. `sources.<source>.command_name_prefix.disable` overrides the top-level setting for that source.
4. `sources.<source>.command_name_prefix.value` is used only when that source is effectively prefixed.

## Examples

### Default names

```jsonc
{
  "sources": {
    "makefile": {},
    "npm-scripts": {},
    "skill": {}
  }
}
```

Result:

- `/make:build`
- `/npm:dev`
- `/skill:review`

### Global disable

```jsonc
{
  "command_name_prefix": {
    "disable": true
  }
}
```

Result:

- `/build`
- `/dev`
- `/review`

### Source override

```jsonc
{
  "command_name_prefix": {
    "disable": true
  },
  "sources": {
    "skill": {
      "command_name_prefix": {
        "disable": false
      }
    }
  }
}
```

Result:

- `/make:build`
- `/npm:dev`
- `/skill:review`

### Custom prefix

```jsonc
{
  "sources": {
    "makefile": {
      "command_name_prefix": {
        "disable": false,
        "value": "maker"
      }
    }
  }
}
```

Result:

- `/maker:build`

## Collision fallback

If a customized name collides with an existing command or another injected command, the plugin falls back to the canonical source-prefixed name and keeps existing/config commands winning.

- Dynamic source collisions log `[command-sources]`
- Existing/config-command collisions log `[command-inject]`

This is the shipped v1 behavior and does not introduce new delimiter rules.
