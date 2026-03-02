# Commands Wire Plugin for Opencode

![Version](https://img.shields.io/npm/v/opencode-commands-wire)

**Automatically inject your project's available tasks into the Opencode CLI catalog.** This plugin scans your project's root directory at startup and exposes `Makefile` targets and `package.json` scripts directly within the Opencode `/` slash command menu.

## Prerequisites

- [Opencode CLI](https://opencode.ai) installed.
- A project with a `Makefile` or `package.json`.

## Installation

Add the plugin to your Opencode configuration file (`~/.config/opencode/opencode.json` or similar):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-commands-wire@latest"]
}
```

> [!NOTE]
> Ensure you have built the plugin (`npm run build`) before starting Opencode if you are using it locally.

## Usage

Once installed, the plugin will automatically scan your project's root directory during Opencode's startup phase. 

You can view and execute these commands by typing `/` in the Opencode CLI.

### Dynamic Command Naming Rules

- **Makefile** targets -> `make:<target>`
- **package.json** scripts -> `npm:<script>`

### Description Rules

- **Makefile**: Prioritizes `target: ## <description>` syntax, falling back to the target name if no description is provided.
- **npm**: Uses the npm script name.

### Template Generation

The plugin maps the commands automatically to the prompt input template:

- **Makefile**: `make <target> $ARGUMENTS`
- **npm**: `npm run <script> -- $ARGUMENTS`

## Plugin Behavior

- **Startup Only**: Commands are loaded only during startup (no hot reloading).
- **Graceful Skipping**: Skips silently if a `Makefile` or `package.json` is missing without interrupting the startup sequence.
- **Conflict Resolution**: Uses a conservative strategy for naming conflicts. Retains the first appearing command and logs a warning for any duplicates.

## Building and Updating

Opencode does not automatically update plugins. To update to the latest version or apply local changes, you must rebuild or clear the cached plugin:

```bash
# Rebuild the plugin
npm run build

# Run Opencode to trigger the new plugin version
opencode
```

## Development

To develop on this plugin locally:

1. **Clone**:

   ```bash
   git clone https://github.com/shihyuho/opencode-commands-wire.git
   cd opencode-commands-wire
   npm install
   ```

2. **Build**:

   ```bash
   npm run build
   ```

3. **Link**:
   Update your Opencode config to point to your local `.opencode/plugins` build directory or your plugin root directory using a `file://` URL:

   ```json
   {
     "plugin": ["file:///path/to/opencode-commands-wire"]
   }
   ```

## License

MIT
