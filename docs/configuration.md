# Configuration

This document is the authoritative contract for `command_name_prefix`.

## Load order

The plugin supports two different environment variables with different scopes:

- `OPENCODE_COMMAND_INJECT_CONFIG`: explicit file-path override for this plugin's config
- `OPENCODE_CONFIG_DIR`: directory override for plugin-owned config/assets lookup

`OPENCODE_COMMAND_INJECT_CONFIG` always wins when set. Otherwise, plugin-owned config is resolved in this order:

1. `OPENCODE_COMMAND_INJECT_CONFIG` if set
2. `${OPENCODE_CONFIG_DIR}/opencode-command-inject.jsonc`
3. `${OPENCODE_CONFIG_DIR}/opencode-command-inject.json`
4. User config:
   - `${XDG_CONFIG_HOME}/opencode/opencode-command-inject.jsonc`
   - `${XDG_CONFIG_HOME}/opencode/opencode-command-inject.json`
   - If `XDG_CONFIG_HOME` is unset, use `~/.config/opencode/` instead
5. Project config (merged on top):
   - `.opencode/opencode-command-inject.jsonc`
   - `.opencode/opencode-command-inject.json`

At each non-env location, `.jsonc` is checked before `.json`.

If `OPENCODE_CONFIG_DIR` is set but does not contain plugin config files, the loader falls back to the existing `${XDG_CONFIG_HOME}/opencode` and `~/.config/opencode` lookup behavior without changing the explicit env-file override semantics.

This support does **not** redefine the main OpenCode config-file path. `OPENCODE_CONFIG_DIR` only changes where this plugin looks for its own config/assets when the explicit plugin file override is unset.

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
