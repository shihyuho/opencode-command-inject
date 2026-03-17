import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { loadPluginConfig } from "./loader"

describe("config loader", () => {
  let tmpDir: string

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
        JSON.stringify({ sources: { makefile: { enabled: false } } })
      )
      const config = await loadPluginConfig(tmpDir)
      expect(config.sources?.makefile?.enabled).toBe(false)
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
      // User config: makefile enabled=false, npm-scripts enabled=true
      const userConfigDir = join(tmpDir, "opencode")
      await mkdir(userConfigDir, { recursive: true })
      await writeFile(
        join(userConfigDir, "opencode-command-inject.json"),
        JSON.stringify({ sources: { makefile: { enabled: false }, "npm-scripts": { enabled: true } } })
      )
      // Project config: makefile enabled=true (only)
      const projectConfigDir = join(tmpDir, ".opencode")
      await mkdir(projectConfigDir, { recursive: true })
      await writeFile(
        join(projectConfigDir, "opencode-command-inject.json"),
        JSON.stringify({ sources: { makefile: { enabled: true } } })
      )
      // Result: makefile enabled=true, npm-scripts enabled=true (merge)
      const config = await loadPluginConfig(tmpDir)
      expect(config.sources?.makefile?.enabled).toBe(true)
      expect(config.sources?.["npm-scripts"]?.enabled).toBe(true)
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
    "makefile": { "enabled": false }
  }
}`
    )
    const config = await loadPluginConfig(tmpDir)
    expect(config.sources?.makefile?.enabled).toBe(false)
  })

  it("respects OPENCODE_COMMAND_INJECT_CONFIG env var", async () => {
    const originalEnv = process.env.OPENCODE_COMMAND_INJECT_CONFIG
    const customConfigPath = join(tmpDir, "custom-config.json")
    await writeFile(
      customConfigPath,
      JSON.stringify({ sources: { makefile: { enabled: false } } })
    )
    process.env.OPENCODE_COMMAND_INJECT_CONFIG = customConfigPath
    try {
      const config = await loadPluginConfig(tmpDir)
      expect(config.sources?.makefile?.enabled).toBe(false)
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
      JSON.stringify({ sources: { makefile: { enabled: false } } })
    )
    // Create default user config that would enable makefile
    const userConfigDir = join(tmpDir, "opencode")
    await mkdir(userConfigDir, { recursive: true })
    await writeFile(
      join(userConfigDir, "opencode-command-inject.json"),
      JSON.stringify({ sources: { makefile: { enabled: true } } })
    )
    process.env.OPENCODE_COMMAND_INJECT_CONFIG = customConfigPath
    try {
      const config = await loadPluginConfig(tmpDir)
      // Should use env var config (enabled: false), not user config (enabled: true)
      expect(config.sources?.makefile?.enabled).toBe(false)
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
        JSON.stringify({ sources: { makefile: { enabled: false } } })
      )
      const config = await loadPluginConfig(tmpDir)
      // Should fall back to user config
      expect(config.sources?.makefile?.enabled).toBe(false)
    } finally {
      if (originalEnv !== undefined) {
        process.env.OPENCODE_COMMAND_INJECT_CONFIG = originalEnv
      } else {
        delete process.env.OPENCODE_COMMAND_INJECT_CONFIG
      }
    }
  })
})
