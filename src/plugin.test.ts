import { join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { CommandInjectPlugin, createCommandInjectPlugin } from "./plugin"
import { withTempDir, writeText } from "./test-utils/temp-dir"

vi.mock("./skills/discovery", () => ({
  discoverSkills: vi.fn(),
}))

vi.mock("./config", () => ({
  loadPluginConfig: vi.fn(),
}))

import { discoverSkills } from "./skills/discovery"
import { loadPluginConfig } from "./config"

function createPluginInput(directory: string) {
  return {
    directory,
    client: {} as Parameters<typeof CommandInjectPlugin>[0]["client"],
    worktree: "",
    serverUrl: new URL("http://localhost:3000"),
    project: {} as Parameters<typeof CommandInjectPlugin>[0]["project"],
    $: {} as Parameters<typeof CommandInjectPlugin>[0]["$"],
  }
}

afterEach(() => {
  vi.clearAllMocks()
})

describe("CommandInjectPlugin discovery integration", () => {
  it("discovers skills and injects skill aliases by default", async () => {
    vi.mocked(discoverSkills).mockResolvedValue([
      {
        name: "review",
        description: "Run review",
        template: "Use skill review $ARGUMENTS",
        sourcePath: "/tmp/review/SKILL.md",
      },
    ])

    await withTempDir(async (dir) => {
      const hooks = await CommandInjectPlugin(createPluginInput(dir))
      const config = { command: {} as Record<string, { template: string; description: string }> }
      await hooks.config?.(config as never)

      expect(discoverSkills).toHaveBeenCalledWith({
        projectRoot: dir,
        logger: expect.objectContaining({ warn: expect.any(Function) }),
      })
      expect(config.command["skill:review"]).toEqual({
        description: "Run review",
        template: "Use skill review $ARGUMENTS",
      })
    })
  })

  it("preserves make and package commands when discovery finds no skills", async () => {
    vi.mocked(discoverSkills).mockResolvedValue([])

    await withTempDir(async (dir) => {
      await writeText(join(dir, "Makefile"), "build: ## Build app")
      await writeText(join(dir, "package.json"), JSON.stringify({ scripts: { start: "node index.js" } }))

      const hooks = await CommandInjectPlugin(createPluginInput(dir))
      const config = { command: {} as Record<string, { template: string; description: string }> }
      await hooks.config?.(config as never)

      expect(config.command).toHaveProperty("make:build")
      expect(config.command).toHaveProperty("npm:start")
      expect(Object.keys(config.command).filter((key) => key.startsWith("skill:"))).toEqual([])
    })
  })

  it("keeps manual loadedSkills in compatibility mode without discovery by default", async () => {
    vi.mocked(discoverSkills).mockResolvedValue([
      {
        name: "review",
        description: "Discovered review",
        template: "discovered $ARGUMENTS",
        sourcePath: "/tmp/review/SKILL.md",
      },
    ])

    const plugin = createCommandInjectPlugin({
      loadedSkills: [{ name: "review", description: "Manual review", template: "manual $ARGUMENTS" }],
    })

    await withTempDir(async (dir) => {
      const hooks = await plugin(createPluginInput(dir))
      const config = { command: {} as Record<string, { template: string; description: string }> }

      await hooks.config?.({ command: config.command } as never)

      expect(discoverSkills).not.toHaveBeenCalled()
      expect(config.command["skill:review"]).toEqual({
        description: "Manual review",
        template: "manual $ARGUMENTS",
      })
    })
  })

  it("lets manual loadedSkills opt into discovery and win duplicate conflicts", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    vi.mocked(discoverSkills).mockResolvedValue([
      {
        name: "review",
        description: "Discovered review",
        template: "discovered $ARGUMENTS",
        sourcePath: "/tmp/review/SKILL.md",
      },
    ])

    const plugin = createCommandInjectPlugin({
      discoverSkills: true,
      loadedSkills: [{ name: "review", description: "Manual review", template: "manual $ARGUMENTS" }],
    })

    await withTempDir(async (dir) => {
      const hooks = await plugin(createPluginInput(dir))
      const config = { command: {} as Record<string, { template: string; description: string }> }

      await hooks.config?.({ command: config.command } as never)

      expect(discoverSkills).toHaveBeenCalled()
      expect(config.command["skill:review"]).toEqual({
        description: "Manual review",
        template: "manual $ARGUMENTS",
      })
      expect(warnSpy).toHaveBeenCalledWith(
        "[command-inject] duplicate discovered skill 'review', keeping manually provided version"
      )
    })

    warnSpy.mockRestore()
  })

  it("lets compatibility mode opt out of discovery entirely", async () => {
    vi.mocked(discoverSkills).mockResolvedValue([
      {
        name: "review",
        description: "Discovered review",
        template: "discovered $ARGUMENTS",
        sourcePath: "/tmp/review/SKILL.md",
      },
    ])

    const plugin = createCommandInjectPlugin({
      discoverSkills: false,
      loadedSkills: [{ name: "manual", description: "Manual only", template: "manual $ARGUMENTS" }],
    })

    await withTempDir(async (dir) => {
      const hooks = await plugin(createPluginInput(dir))
      const config = { command: {} as Record<string, { template: string; description: string }> }

      await hooks.config?.({ command: config.command } as never)

      expect(discoverSkills).not.toHaveBeenCalled()
      expect(config.command).toHaveProperty("skill:manual")
      expect(config.command).not.toHaveProperty("skill:review")
    })
  })

  it("still uses discovery when loadedSkills is an empty array", async () => {
    vi.mocked(discoverSkills).mockResolvedValue([
      {
        name: "review",
        description: "Discovered review",
        template: "discovered $ARGUMENTS",
        sourcePath: "/tmp/review/SKILL.md",
      },
    ])

    const plugin = createCommandInjectPlugin({
      loadedSkills: [],
    })

    await withTempDir(async (dir) => {
      const hooks = await plugin(createPluginInput(dir))
      const config = { command: {} as Record<string, { template: string; description: string }> }

      await hooks.config?.({ command: config.command } as never)

      expect(discoverSkills).toHaveBeenCalled()
      expect(config.command).toHaveProperty("skill:review")
    })
  })

  describe("config integration", () => {
    it("loads config and passes to sources", async () => {
      vi.mocked(loadPluginConfig).mockResolvedValue({
        sources: {
          makefile: { enabled: true, prompt: "make {name}" },
          "npm-scripts": { enabled: true },
        },
      })
      vi.mocked(discoverSkills).mockResolvedValue([])

      await withTempDir(async (dir) => {
        await writeText(join(dir, "Makefile"), "build: ## Build app\ntest: ## Run tests")
        await writeText(join(dir, "package.json"), JSON.stringify({ scripts: { start: "node index.js" } }))

        const hooks = await CommandInjectPlugin(createPluginInput(dir))
        const config = { command: {} as Record<string, { template: string; description: string }> }
        await hooks.config?.(config as never)

        expect(loadPluginConfig).toHaveBeenCalledWith(dir)
        expect(config.command).toHaveProperty("make:build")
        expect(config.command).toHaveProperty("npm:start")
      })
    })

    it("skips disabled sources", async () => {
      vi.mocked(loadPluginConfig).mockResolvedValue({
        sources: {
          makefile: { enabled: false },
          "npm-scripts": { enabled: true },
        },
      })
      vi.mocked(discoverSkills).mockResolvedValue([])

      await withTempDir(async (dir) => {
        await writeText(join(dir, "Makefile"), "build: ## Build app")
        await writeText(join(dir, "package.json"), JSON.stringify({ scripts: { start: "node index.js" } }))

        const hooks = await CommandInjectPlugin(createPluginInput(dir))
        const config = { command: {} as Record<string, { template: string; description: string }> }
        await hooks.config?.(config as never)

        expect(config.command).not.toHaveProperty("make:build")
        expect(config.command).toHaveProperty("npm:start")
      })
    })

    it("skips skill source when disabled in config", async () => {
      vi.mocked(loadPluginConfig).mockResolvedValue({
        sources: {
          skill: { enabled: false },
        },
      })
      vi.mocked(discoverSkills).mockResolvedValue([
        {
          name: "review",
          description: "Run review",
          template: "Use skill review $ARGUMENTS",
          sourcePath: "/tmp/review/SKILL.md",
        },
      ])

      await withTempDir(async (dir) => {
        const hooks = await CommandInjectPlugin(createPluginInput(dir))
        const config = { command: {} as Record<string, { template: string; description: string }> }
        await hooks.config?.(config as never)

        expect(config.command).not.toHaveProperty("skill:review")
      })
    })

    it("uses default enabled when config is empty", async () => {
      vi.mocked(loadPluginConfig).mockResolvedValue({})
      vi.mocked(discoverSkills).mockResolvedValue([])

      await withTempDir(async (dir) => {
        await writeText(join(dir, "Makefile"), "build: ## Build app")
        await writeText(join(dir, "package.json"), JSON.stringify({ scripts: { start: "node index.js" } }))

        const hooks = await CommandInjectPlugin(createPluginInput(dir))
        const config = { command: {} as Record<string, { template: string; description: string }> }
        await hooks.config?.(config as never)

        expect(config.command).toHaveProperty("make:build")
        expect(config.command).toHaveProperty("npm:start")
      })
    })
  })
})
