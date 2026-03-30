import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { loadPluginConfig } from "./loader"

describe("config loader", () => {
  let tmpDir: string

  async function createSandbox(name: string): Promise<string> {
    const dir = join(tmpDir, name)
    await rm(dir, { recursive: true, force: true })
    await mkdir(dir, { recursive: true })
    return dir
  }

  async function writePluginConfig(baseDir: string, relativeDir: string, fileName: string, config: unknown): Promise<void> {
    const configDir = join(baseDir, relativeDir)
    await mkdir(configDir, { recursive: true })
    await writeFile(join(configDir, fileName), JSON.stringify(config))
  }

  beforeAll(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "command-inject-test-"))
  })

  afterAll(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it("returns empty object when no config files exist", async () => {
    const originalXdg = process.env.XDG_CONFIG_HOME
    process.env.XDG_CONFIG_HOME = tmpDir
    try {
      const config = await loadPluginConfig(tmpDir)
      expect(config).toEqual({})
    } finally {
      if (originalXdg !== undefined) {
        process.env.XDG_CONFIG_HOME = originalXdg
      } else {
        delete process.env.XDG_CONFIG_HOME
      }
    }
  })

  it("loads user config", async () => {
    const originalXdg = process.env.XDG_CONFIG_HOME
    process.env.XDG_CONFIG_HOME = tmpDir
    try {
      const configDir = join(tmpDir, "opencode")
      await mkdir(configDir, { recursive: true })
      await writeFile(
        join(configDir, "opencode-command-inject.json"),
        JSON.stringify({ sources: { makefile: { disable: true } } })
      )
      const config = await loadPluginConfig(tmpDir)
      expect(config.sources?.makefile?.disable).toBe(true)
    } finally {
      if (originalXdg !== undefined) {
        process.env.XDG_CONFIG_HOME = originalXdg
      } else {
        delete process.env.XDG_CONFIG_HOME
      }
    }
  })

  it("prefers project config over user config (deep merge)", async () => {
    const originalXdg = process.env.XDG_CONFIG_HOME
    process.env.XDG_CONFIG_HOME = tmpDir
    try {
      // User config: makefile disable=true, npm-scripts disable=false
      const userConfigDir = join(tmpDir, "opencode")
      await mkdir(userConfigDir, { recursive: true })
      await writeFile(
        join(userConfigDir, "opencode-command-inject.json"),
        JSON.stringify({ sources: { makefile: { disable: true }, "npm-scripts": { disable: false } } })
      )
      // Project config: makefile disable=false (only)
      const projectConfigDir = join(tmpDir, ".opencode")
      await mkdir(projectConfigDir, { recursive: true })
      await writeFile(
        join(projectConfigDir, "opencode-command-inject.json"),
        JSON.stringify({ sources: { makefile: { disable: false } } })
      )
      // Result: makefile disable=false, npm-scripts disable=false (merge)
      const config = await loadPluginConfig(tmpDir)
      expect(config.sources?.makefile?.disable).toBe(false)
      expect(config.sources?.["npm-scripts"]?.disable).toBe(false)
    } finally {
      if (originalXdg !== undefined) {
        process.env.XDG_CONFIG_HOME = originalXdg
      } else {
        delete process.env.XDG_CONFIG_HOME
      }
    }
  })

  it("deep merges nested source command_name_prefix fields", async () => {
    const originalXdg = process.env.XDG_CONFIG_HOME
    process.env.XDG_CONFIG_HOME = tmpDir
    try {
      const userConfigDir = join(tmpDir, "opencode")
      await mkdir(userConfigDir, { recursive: true })
      await writeFile(
        join(userConfigDir, "opencode-command-inject.json"),
        JSON.stringify({
          sources: {
            makefile: {
              prompt: "user prompt",
              command_name_prefix: { disable: false },
            },
          },
        })
      )

      const projectConfigDir = join(tmpDir, ".opencode")
      await mkdir(projectConfigDir, { recursive: true })
      await writeFile(
        join(projectConfigDir, "opencode-command-inject.json"),
        JSON.stringify({
          sources: {
            makefile: {
              command_name_prefix: { value: "maker" },
            },
          },
        })
      )

      const config = await loadPluginConfig(tmpDir)

      expect(config.sources?.makefile?.prompt).toBe("user prompt")
      expect(config.sources?.makefile?.command_name_prefix).toEqual({
        disable: false,
        value: "maker",
      })
    } finally {
      if (originalXdg !== undefined) {
        process.env.XDG_CONFIG_HOME = originalXdg
      } else {
        delete process.env.XDG_CONFIG_HOME
      }
    }
  })

  it("supports .jsonc format with comments", async () => {
    const projectConfigDir = join(tmpDir, ".opencode")
    await mkdir(projectConfigDir, { recursive: true })
    await writeFile(
      join(projectConfigDir, "opencode-command-inject.jsonc"),
      `// This is a comment
{
  "sources": {
    "makefile": { "disable": false }
  }
}`
    )
    const config = await loadPluginConfig(tmpDir)
    expect(config.sources?.makefile?.disable).toBe(false)
  })

  it("respects OPENCODE_COMMAND_INJECT_CONFIG env var", async () => {
    const originalEnv = process.env.OPENCODE_COMMAND_INJECT_CONFIG
    const customConfigPath = join(tmpDir, "custom-config.json")
    await writeFile(
      customConfigPath,
      JSON.stringify({ sources: { makefile: { disable: false } } })
    )
    process.env.OPENCODE_COMMAND_INJECT_CONFIG = customConfigPath
    try {
      const config = await loadPluginConfig(tmpDir)
      expect(config.sources?.makefile?.disable).toBe(false)
    } finally {
      if (originalEnv !== undefined) {
        process.env.OPENCODE_COMMAND_INJECT_CONFIG = originalEnv
      } else {
        delete process.env.OPENCODE_COMMAND_INJECT_CONFIG
      }
    }
  })

  it("env var takes precedence over default paths", async () => {
    const originalEnv = process.env.OPENCODE_COMMAND_INJECT_CONFIG
    // Create custom config
    const customConfigPath = join(tmpDir, "custom-config.json")
    await writeFile(
      customConfigPath,
      JSON.stringify({ sources: { makefile: { disable: false } } })
    )
    // Create default user config that would enable makefile
    const userConfigDir = join(tmpDir, "opencode")
    await mkdir(userConfigDir, { recursive: true })
    await writeFile(
      join(userConfigDir, "opencode-command-inject.json"),
      JSON.stringify({ sources: { makefile: { disable: true } } })
    )
    process.env.OPENCODE_COMMAND_INJECT_CONFIG = customConfigPath
    try {
      const config = await loadPluginConfig(tmpDir)
      // Should use env var config (disable: false), not user config (disable: true)
      expect(config.sources?.makefile?.disable).toBe(false)
    } finally {
      if (originalEnv !== undefined) {
        process.env.OPENCODE_COMMAND_INJECT_CONFIG = originalEnv
      } else {
        delete process.env.OPENCODE_COMMAND_INJECT_CONFIG
      }
    }
  })

  it("falls back to default paths when env var points to non-existent file", async () => {
    const originalEnv = process.env.OPENCODE_COMMAND_INJECT_CONFIG
    process.env.OPENCODE_COMMAND_INJECT_CONFIG = "/non/existent/path.json"
    try {
      // Create default user config
      const userConfigDir = join(tmpDir, "opencode")
      await mkdir(userConfigDir, { recursive: true })
      await writeFile(
        join(userConfigDir, "opencode-command-inject.json"),
        JSON.stringify({ sources: { makefile: { disable: false } } })
      )
      const config = await loadPluginConfig(tmpDir)
      // Should fall back to user config
      expect(config.sources?.makefile?.disable).toBe(false)
    } finally {
      if (originalEnv !== undefined) {
        process.env.OPENCODE_COMMAND_INJECT_CONFIG = originalEnv
      } else {
        delete process.env.OPENCODE_COMMAND_INJECT_CONFIG
      }
    }
  })

  it("prefers OPENCODE_COMMAND_INJECT_CONFIG over OPENCODE_CONFIG_DIR", async () => {
    const sandbox = await createSandbox("config-dir-env-file-wins")
    const originalEnvConfig = process.env.OPENCODE_COMMAND_INJECT_CONFIG
    const originalConfigDir = process.env.OPENCODE_CONFIG_DIR
    const originalXdg = process.env.XDG_CONFIG_HOME

    await writePluginConfig(sandbox, "custom-opencode", "opencode-command-inject.json", {
      sources: { makefile: { disable: true } },
    })

    const envConfigPath = join(sandbox, "explicit.json")
    await writeFile(envConfigPath, JSON.stringify({ sources: { makefile: { disable: false } } }))

    process.env.OPENCODE_COMMAND_INJECT_CONFIG = envConfigPath
    process.env.OPENCODE_CONFIG_DIR = join(sandbox, "custom-opencode")
    process.env.XDG_CONFIG_HOME = join(sandbox, "xdg")

    try {
      const config = await loadPluginConfig(join(sandbox, "project"))
      expect(config.sources?.makefile?.disable).toBe(false)
    } finally {
      if (originalEnvConfig !== undefined) {
        process.env.OPENCODE_COMMAND_INJECT_CONFIG = originalEnvConfig
      } else {
        delete process.env.OPENCODE_COMMAND_INJECT_CONFIG
      }

      if (originalConfigDir !== undefined) {
        process.env.OPENCODE_CONFIG_DIR = originalConfigDir
      } else {
        delete process.env.OPENCODE_CONFIG_DIR
      }

      if (originalXdg !== undefined) {
        process.env.XDG_CONFIG_HOME = originalXdg
      } else {
        delete process.env.XDG_CONFIG_HOME
      }
    }
  })

  it("uses OPENCODE_CONFIG_DIR before XDG_CONFIG_HOME when env file override is unset", async () => {
    const sandbox = await createSandbox("config-dir-precedes-xdg")
    const originalEnvConfig = process.env.OPENCODE_COMMAND_INJECT_CONFIG
    const originalConfigDir = process.env.OPENCODE_CONFIG_DIR
    const originalXdg = process.env.XDG_CONFIG_HOME

    await writePluginConfig(sandbox, "custom-opencode", "opencode-command-inject.json", {
      sources: { makefile: { disable: true } },
    })
    await writePluginConfig(sandbox, "xdg/opencode", "opencode-command-inject.json", {
      sources: { makefile: { disable: false } },
    })

    delete process.env.OPENCODE_COMMAND_INJECT_CONFIG
    process.env.OPENCODE_CONFIG_DIR = join(sandbox, "custom-opencode")
    process.env.XDG_CONFIG_HOME = join(sandbox, "xdg")

    try {
      const config = await loadPluginConfig(join(sandbox, "project"))
      expect(config.sources?.makefile?.disable).toBe(true)
    } finally {
      if (originalEnvConfig !== undefined) {
        process.env.OPENCODE_COMMAND_INJECT_CONFIG = originalEnvConfig
      } else {
        delete process.env.OPENCODE_COMMAND_INJECT_CONFIG
      }

      if (originalConfigDir !== undefined) {
        process.env.OPENCODE_CONFIG_DIR = originalConfigDir
      } else {
        delete process.env.OPENCODE_CONFIG_DIR
      }

      if (originalXdg !== undefined) {
        process.env.XDG_CONFIG_HOME = originalXdg
      } else {
        delete process.env.XDG_CONFIG_HOME
      }
    }
  })

  it("keeps home-directory fallback semantics when OPENCODE_CONFIG_DIR is unset", async () => {
    const sandbox = await createSandbox("config-dir-home-fallback")
    const originalEnvConfig = process.env.OPENCODE_COMMAND_INJECT_CONFIG
    const originalConfigDir = process.env.OPENCODE_CONFIG_DIR
    const originalXdg = process.env.XDG_CONFIG_HOME
    const originalHome = process.env.HOME

    await writePluginConfig(sandbox, "home/.config/opencode", "opencode-command-inject.json", {
      sources: { makefile: { disable: true } },
    })

    delete process.env.OPENCODE_COMMAND_INJECT_CONFIG
    delete process.env.OPENCODE_CONFIG_DIR
    delete process.env.XDG_CONFIG_HOME
    process.env.HOME = join(sandbox, "home")

    try {
      const config = await loadPluginConfig(join(sandbox, "project"))
      expect(config.sources?.makefile?.disable).toBe(true)
    } finally {
      if (originalHome !== undefined) {
        process.env.HOME = originalHome
      } else {
        delete process.env.HOME
      }

      if (originalEnvConfig !== undefined) {
        process.env.OPENCODE_COMMAND_INJECT_CONFIG = originalEnvConfig
      } else {
        delete process.env.OPENCODE_COMMAND_INJECT_CONFIG
      }

      if (originalConfigDir !== undefined) {
        process.env.OPENCODE_CONFIG_DIR = originalConfigDir
      } else {
        delete process.env.OPENCODE_CONFIG_DIR
      }

      if (originalXdg !== undefined) {
        process.env.XDG_CONFIG_HOME = originalXdg
      } else {
        delete process.env.XDG_CONFIG_HOME
      }
    }
  })

  it("falls back to XDG config lookup when OPENCODE_CONFIG_DIR has no plugin config files", async () => {
    const sandbox = await createSandbox("config-dir-missing-falls-back")
    const originalEnvConfig = process.env.OPENCODE_COMMAND_INJECT_CONFIG
    const originalConfigDir = process.env.OPENCODE_CONFIG_DIR
    const originalXdg = process.env.XDG_CONFIG_HOME

    await mkdir(join(sandbox, "custom-opencode"), { recursive: true })
    await writePluginConfig(sandbox, "xdg/opencode", "opencode-command-inject.json", {
      sources: { makefile: { disable: false } },
    })

    delete process.env.OPENCODE_COMMAND_INJECT_CONFIG
    process.env.OPENCODE_CONFIG_DIR = join(sandbox, "custom-opencode")
    process.env.XDG_CONFIG_HOME = join(sandbox, "xdg")

    try {
      const config = await loadPluginConfig(join(sandbox, "project"))
      expect(config.sources?.makefile?.disable).toBe(false)
    } finally {
      if (originalEnvConfig !== undefined) {
        process.env.OPENCODE_COMMAND_INJECT_CONFIG = originalEnvConfig
      } else {
        delete process.env.OPENCODE_COMMAND_INJECT_CONFIG
      }

      if (originalConfigDir !== undefined) {
        process.env.OPENCODE_CONFIG_DIR = originalConfigDir
      } else {
        delete process.env.OPENCODE_CONFIG_DIR
      }

      if (originalXdg !== undefined) {
        process.env.XDG_CONFIG_HOME = originalXdg
      } else {
        delete process.env.XDG_CONFIG_HOME
      }
    }
  })
})
