import { join } from "node:path"
import { describe, expect, it, vi } from "vitest"

import { createCommandInjectHooks } from "./command-inject"
import type { CommandInfo } from "../command-sources"
import { withTempDir, writeText } from "../test-utils/temp-dir"

describe("createCommandInjectHooks", () => {
  it("injects make and npm commands during startup", async () => {
    await withTempDir(async (dir) => {
      await writeText(join(dir, "Makefile"), "build: ## Build app")
      await writeText(join(dir, "package.json"), JSON.stringify({ scripts: { test: "vitest" } }))

      const existingCommands: CommandInfo[] = [
        { name: "skill:demo", description: "demo", template: "demo $ARGUMENTS" },
      ]
      const hooks = await createCommandInjectHooks({
        projectRoot: dir,
        logger: { warn: vi.fn() },
        existingCommands,
      })

      const configFn = hooks.config as (config: { command?: Record<string, unknown> }) => Promise<void>
      const config: { command?: Record<string, { template: string; description: string }> } = {}
      await configFn(config)

      expect(hooks).toHaveProperty("command.execute.before")
      expect(config.command).toHaveProperty("make:build")
      expect(config.command).toHaveProperty("npm:test")
    })
  })

  it("applies mixed prefix config without changing no-config defaults", async () => {
    await withTempDir(async (dir) => {
      await writeText(join(dir, "Makefile"), "build: ## Build app")
      await writeText(join(dir, "package.json"), JSON.stringify({ packageManager: "pnpm@10.0.0", scripts: { test: "vitest" } }))

      const hooks = await createCommandInjectHooks({
        projectRoot: dir,
        logger: { warn: vi.fn() },
        existingCommands: [],
        loadedSkills: [{ name: "review:security", description: "Security review", template: "echo" }],
        config: {
          command_name_prefix: {
            disable: true,
          },
          sources: {
            makefile: {
              command_name_prefix: {
                disable: false,
              },
            },
            skill: {
              command_name_prefix: {
                value: "custom",
              },
            },
          },
        },
      })

      const configFn = hooks.config as (config: { command?: Record<string, unknown> }) => Promise<void>
      const config: { command?: Record<string, { template: string; description: string }> } = {}
      await configFn(config)

      expect(config.command).toHaveProperty("make:build")
      expect(config.command).toHaveProperty("test")
      expect(config.command).toHaveProperty("review:security")
      expect(config.command).not.toHaveProperty("pnpm:test")
      expect(config.command).not.toHaveProperty("custom:review:security")
    })
  })

  it("does not overwrite existing command on conflict", async () => {
    await withTempDir(async (dir) => {
      await writeText(join(dir, "Makefile"), "build: ## Build app")
      const warn = vi.fn<(message: string) => void>()

      const hooks = await createCommandInjectHooks({
        projectRoot: dir,
        logger: { warn },
        existingCommands: [{ name: "make:build", description: "existing", template: "custom build" }],
      })

      expect(hooks).toHaveProperty("command.execute.before")
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("make:build"))
    })
  })

  it("falls back a customized dynamic collision against an existing command to the canonical name", async () => {
    await withTempDir(async (dir) => {
      await writeText(join(dir, "Makefile"), "build: ## Build app")
      const warn = vi.fn<(message: string) => void>()

      const hooks = await createCommandInjectHooks({
        projectRoot: dir,
        logger: { warn },
        existingCommands: [{ name: "build", description: "existing", template: "existing build" }],
        config: {
          command_name_prefix: {
            disable: true,
          },
        },
      })

      const configFn = hooks.config as (config: {
        command?: Record<string, { template: string; description: string }>
      }) => Promise<void>
      const config = {
        command: {
          build: {
            template: "existing build",
            description: "existing",
          },
        },
      }

      await configFn(config)

      expect(config.command).toHaveProperty("build")
      expect(config.command).toHaveProperty("make:build")
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("[command-inject]"))
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("customized command name collision on 'build'"))
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("makefile"))
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("make:build"))
    })
  })

  it("keeps existing command precedence when canonical fallback also collides", async () => {
    await withTempDir(async (dir) => {
      await writeText(join(dir, "Makefile"), "build: ## Build app")
      const warn = vi.fn<(message: string) => void>()

      const hooks = await createCommandInjectHooks({
        projectRoot: dir,
        logger: { warn },
        existingCommands: [
          { name: "build", description: "existing raw", template: "existing build" },
          { name: "make:build", description: "existing canonical", template: "existing make build" },
        ],
        config: {
          command_name_prefix: {
            disable: true,
          },
        },
      })

      const configFn = hooks.config as (config: {
        command?: Record<string, { template: string; description: string }>
      }) => Promise<void>
      const config = {
        command: {
          build: {
            template: "existing build",
            description: "existing raw",
          },
          "make:build": {
            template: "existing make build",
            description: "existing canonical",
          },
        },
      }

      await configFn(config)

      expect(config.command["make:build"].description).toBe("existing canonical")
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("attempted canonical fallback"))
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("keeping existing"))
    })
  })

  it("falls back only the actual collision group when config-defined commands block a customized name", async () => {
    await withTempDir(async (dir) => {
      await writeText(join(dir, "Makefile"), "build: ## Build app")
      await writeText(
        join(dir, "package.json"),
        JSON.stringify({ packageManager: "pnpm@10.0.0", scripts: { build: "vite build", test: "vitest" } })
      )
      const warn = vi.fn<(message: string) => void>()

      const hooks = await createCommandInjectHooks({
        projectRoot: dir,
        logger: { warn },
        existingCommands: [],
        config: {
          command_name_prefix: {
            disable: true,
          },
          sources: {
            "npm-scripts": {
              command_name_prefix: {
                disable: false,
                value: "package",
              },
            },
          },
        },
      })

      const configFn = hooks.config as (config: {
        command?: Record<string, { template: string; description: string }>
      }) => Promise<void>
      const config = {
        command: {
          build: {
            template: "external build",
            description: "external build",
          },
        },
      }

      await configFn(config)

      expect(config.command).toHaveProperty("build")
      expect(config.command).toHaveProperty("make:build")
      expect(config.command).toHaveProperty("package:build")
      expect(config.command).toHaveProperty("package:test")
      expect(config.command).not.toHaveProperty("test")
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("customized command name collision on 'build'"))
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("makefile"))
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("make:build"))
    })
  })

  it("keeps config-defined command precedence when canonical fallback also collides with config", async () => {
    await withTempDir(async (dir) => {
      await writeText(join(dir, "Makefile"), "build: ## Build app")
      const warn = vi.fn<(message: string) => void>()

      const hooks = await createCommandInjectHooks({
        projectRoot: dir,
        logger: { warn },
        existingCommands: [],
        config: {
          command_name_prefix: {
            disable: true,
          },
        },
      })

      const configFn = hooks.config as (config: {
        command?: Record<string, { template: string; description: string }>
      }) => Promise<void>
      const config = {
        command: {
          build: {
            template: "external build",
            description: "external build",
          },
          "make:build": {
            template: "external make build",
            description: "external make build",
          },
        },
      }

      await configFn(config)

      expect(config.command["make:build"].description).toBe("external make build")
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("attempted canonical fallback"))
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("keeping existing"))
    })
  })

  it("normalizes skill names from loadedSkills (with/without prefix)", async () => {
    await withTempDir(async (dir) => {
      const loadedSkills = [
        { name: "skill: greet", description: "Greet with prefix", template: "echo hello $ARGUMENTS" },
        { name: "skill:farewell", template: "echo goodbye $ARGUMENTS" },
        { name: "hello", description: "Simple name", template: "echo hi $ARGUMENTS" },
      ]

      const hooks = await createCommandInjectHooks({
        projectRoot: dir,
        logger: { warn: vi.fn() },
        existingCommands: [],
        loadedSkills,
      })

      const configFn = hooks.config as (config: { command?: Record<string, unknown> }) => Promise<void>
      const config: { command?: Record<string, { template: string; description: string }> } = {}
      await configFn(config)

      // All should normalize to skill:<name>
      expect(config.command).toHaveProperty("skill:greet")
      expect(config.command?.["skill:greet"].description).toBe("Greet with prefix")
      expect(config.command).toHaveProperty("skill:farewell")
      expect(config.command?.["skill:farewell"].description).toBe("farewell")
      expect(config.command).toHaveProperty("skill:hello")
      expect(config.command?.["skill:hello"].description).toBe("Simple name")
    })
  })

  it("injects all three sources with conflict handling", async () => {
    await withTempDir(async (dir) => {
      await writeText(join(dir, "Makefile"), "build: ## Build app\ntest: ## Run tests")
      await writeText(join(dir, "package.json"), JSON.stringify({ scripts: { start: "node index.js" } }))

      const warn = vi.fn<(message: string) => void>()
      const existingCommands: CommandInfo[] = [
        { name: "skill:greet", description: "existing greet", template: "custom greet $ARGUMENTS" },
      ]

      const loadedSkills = [
        { name: "greet", description: "new greet", template: "echo hello $ARGUMENTS" },
        { name: "farewell", description: "Say goodbye", template: "echo goodbye $ARGUMENTS" },
      ]

      const hooks = await createCommandInjectHooks({
        projectRoot: dir,
        logger: { warn },
        existingCommands,
        loadedSkills,
      })

      const configFn = hooks.config as (config: { command?: Record<string, unknown> }) => Promise<void>
      const config: { command?: Record<string, { template: string; description: string }> } = {}
      await configFn(config)

      expect(config.command).toHaveProperty("make:build")
      expect(config.command).toHaveProperty("make:test")

      expect(config.command).toHaveProperty("npm:start")

      expect(config.command).toHaveProperty("skill:greet")
      expect(config.command?.["skill:greet"].description).toBe("existing greet")
      expect(config.command?.["skill:greet"].template).toBe("custom greet $ARGUMENTS")

      expect(config.command).toHaveProperty("skill:farewell")
      expect(config.command?.["skill:farewell"].description).toBe("Say goodbye")

      expect(warn).toHaveBeenCalledWith(expect.stringContaining("skill:greet"))
    })
  })

  it("command.execute.before injects template text and replaces $ARGUMENTS", async () => {
    await withTempDir(async (dir) => {
      const loadedSkills = [
        { name: "greet", description: "Greet someone", template: "echo hello $ARGUMENTS" },
      ]

      const hooks = await createCommandInjectHooks({
        projectRoot: dir,
        logger: { warn: vi.fn() },
        existingCommands: [],
        loadedSkills,
      })

      const configFn = hooks.config as (config: { command?: Record<string, unknown> }) => Promise<void>
      await configFn({})

      const executeBefore = hooks["command.execute.before"] as (inp: {
        command: string
        arguments?: string
      }, output: { parts: Array<{ type: string; text: string }> }) => Promise<void>

      // Test with arguments - verify text is inserted at FRONT of output.parts
      const output1 = { parts: [{ type: "existing", text: "previous content" }] as Array<{ type: string; text: string }> }
      await executeBefore({ command: "skill:greet", arguments: "world" }, output1)

      expect(output1.parts).toHaveLength(2)
      // Verify new text is inserted at the front (index 0)
      expect(output1.parts[0].type).toBe("text")
      expect(output1.parts[0].text).toBe("echo hello world")
      // Verify existing content is shifted to index 1
      expect(output1.parts[1].type).toBe("existing")
      expect(output1.parts[1].text).toBe("previous content")

      // Test without arguments (should replace with empty string)
      const output2 = { parts: [{ type: "existing", text: "prev" }] as Array<{ type: string; text: string }> }
      await executeBefore({ command: "skill:greet" }, output2)

      expect(output2.parts).toHaveLength(2)
      expect(output2.parts[0].type).toBe("text")
      expect(output2.parts[0].text).toBe("echo hello")
      expect(output2.parts[1].text).toBe("prev")

      // Test non-existent command (should not inject, existing content preserved)
      const output3 = { parts: [{ type: "existing", text: "prev" }] as Array<{ type: string; text: string }> }
      await executeBefore({ command: "skill:unknown", arguments: "test" }, output3)

      expect(output3.parts).toHaveLength(1)
      expect(output3.parts[0].text).toBe("prev")
    })
  })

  it("command.execute.before replaces every $ARGUMENTS placeholder", async () => {
    await withTempDir(async (dir) => {
      const hooks = await createCommandInjectHooks({
        projectRoot: dir,
        logger: { warn: vi.fn() },
        existingCommands: [],
        loadedSkills: [{ name: "repeat", template: "$ARGUMENTS -> $ARGUMENTS" }],
      })

      const configFn = hooks.config as (config: { command?: Record<string, unknown> }) => Promise<void>
      await configFn({})

      const executeBefore = hooks["command.execute.before"] as (inp: {
        command: string
        arguments?: string
      }, output: { parts: Array<{ type: string; text: string }> }) => Promise<void>

      const output = { parts: [] as Array<{ type: string; text: string }> }
      await executeBefore({ command: "skill:repeat", arguments: "echo" }, output)

      expect(output.parts[0].text).toBe("echo -> echo")
    })
  })

  it("command.execute.before does not intercept commands already present in config", async () => {
    await withTempDir(async (dir) => {
      const hooks = await createCommandInjectHooks({
        projectRoot: dir,
        logger: { warn: vi.fn() },
        existingCommands: [],
        loadedSkills: [{ name: "greet", template: "echo hello $ARGUMENTS" }],
      })

      const configFn = hooks.config as (config: {
        command?: Record<string, { template: string; description: string }>
      }) => Promise<void>
      const executeBefore = hooks["command.execute.before"] as (inp: {
        command: string
        arguments?: string
      }, output: { parts: Array<{ type: string; text: string }> }) => Promise<void>

      const config = {
        command: {
          "skill:greet": {
            template: "external greet",
            description: "external",
          },
        },
      }

      await configFn(config)

      const output = { parts: [{ type: "existing", text: "prev" }] as Array<{ type: string; text: string }> }
      await executeBefore({ command: "skill:greet", arguments: "world" }, output)

      expect(config.command["skill:greet"].template).toBe("external greet")
      expect(output.parts).toHaveLength(1)
      expect(output.parts[0].text).toBe("prev")
    })
  })

  it("warns when config already contains the command name", async () => {
    await withTempDir(async (dir) => {
      const warn = vi.fn<(message: string) => void>()
      const hooks = await createCommandInjectHooks({
        projectRoot: dir,
        logger: { warn },
        existingCommands: [],
        loadedSkills: [{ name: "greet", template: "echo hello $ARGUMENTS" }],
      })

      const configFn = hooks.config as (config: {
        command?: Record<string, { template: string; description: string }>
      }) => Promise<void>

      await configFn({
        command: {
          "skill:greet": {
            template: "external",
            description: "external",
          },
        },
      })

      expect(warn).toHaveBeenCalledWith(
        "[command-inject] command 'skill:greet' already exists in config, skipping injection"
      )
    })
  })
})
