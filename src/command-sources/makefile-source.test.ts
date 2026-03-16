import { join } from "node:path"
import { describe, expect, it, vi } from "vitest"

import { MakefileCommandSource } from "./makefile-source"
import { withTempDir, writeText } from "../test-utils/temp-dir"

describe("MakefileCommandSource", () => {
  it("loads make commands from Makefile", async () => {
    await withTempDir(async (dir) => {
      await writeText(
        join(dir, "Makefile"),
        ["build: ## Build app", "test:"].join("\n")
      )

      const warn = vi.fn<(message: string) => void>()
      const source = new MakefileCommandSource()
      const commands = await source.load({ rootDir: dir, logger: { warn } })

      expect(commands).toEqual([
        {
          name: "make:build",
          description: "Build app",
          template: "Use shell to execute `make build $ARGUMENTS`"
        },
        {
          name: "make:test",
          description: "test",
          template: "Use shell to execute `make test $ARGUMENTS`"
        }
      ])
      expect(warn).not.toHaveBeenCalled()
    })
  })

  it("returns empty when Makefile does not exist", async () => {
    await withTempDir(async (dir) => {
      const source = new MakefileCommandSource()
      const commands = await source.load({ rootDir: dir, logger: { warn: vi.fn() } })
      expect(commands).toEqual([])
    })
  })

  // === Config: prompt only ===

  it("uses custom prompt with variable substitution", async () => {
    await withTempDir(async (dir) => {
      await writeText(
        join(dir, "Makefile"),
        "build: ## Build the app"
      )

      const source = new MakefileCommandSource({
        prompt: "Run {name}: {command} {arguments}"
      })
      const commands = await source.load({ rootDir: dir, logger: { warn: vi.fn() } })

      expect(commands).toEqual([
        {
          name: "make:build",
          description: "Build the app",
          template: "Run build: make build $ARGUMENTS"
        }
      ])
    })
  })

  it("substitutes {name} in custom prompt", async () => {
    await withTempDir(async (dir) => {
      await writeText(join(dir, "Makefile"), "build: ## Build")

      const source = new MakefileCommandSource({
        prompt: "Target: {name}"
      })
      const commands = await source.load({ rootDir: dir, logger: { warn: vi.fn() } })

      expect(commands[0].template).toBe("Target: build")
    })
  })

  it("substitutes {description} in custom prompt", async () => {
    await withTempDir(async (dir) => {
      await writeText(join(dir, "Makefile"), "build: ## Build the project")

      const source = new MakefileCommandSource({
        prompt: "Desc: {description}"
      })
      const commands = await source.load({ rootDir: dir, logger: { warn: vi.fn() } })

      expect(commands[0].template).toBe("Desc: Build the project")
    })
  })

  it("substitutes {command} in custom prompt", async () => {
    await withTempDir(async (dir) => {
      await writeText(join(dir, "Makefile"), "build: ## Build")

      const source = new MakefileCommandSource({
        prompt: "Cmd: {command}"
      })
      const commands = await source.load({ rootDir: dir, logger: { warn: vi.fn() } })

      expect(commands[0].template).toBe("Cmd: make build")
    })
  })

  it("substitutes {arguments} in custom prompt", async () => {
    await withTempDir(async (dir) => {
      await writeText(join(dir, "Makefile"), "build:")

      const source = new MakefileCommandSource({
        prompt: "Args: {arguments}"
      })
      const commands = await source.load({ rootDir: dir, logger: { warn: vi.fn() } })

      expect(commands[0].template).toBe("Args: $ARGUMENTS")
    })
  })

  // === Config: prompt_append only ===

  it("appends to default prompt when only prompt_append is set", async () => {
    await withTempDir(async (dir) => {
      await writeText(join(dir, "Makefile"), "build: ## Build app")

      const source = new MakefileCommandSource({
        prompt_append: "\n\nNote: extra info"
      })
      const commands = await source.load({ rootDir: dir, logger: { warn: vi.fn() } })

      expect(commands).toEqual([
        {
          name: "make:build",
          description: "Build app",
          template: "Use shell to execute `make build $ARGUMENTS`\n\nNote: extra info"
        }
      ])
    })
  })

  it("substitutes variables in prompt_append", async () => {
    await withTempDir(async (dir) => {
      await writeText(join(dir, "Makefile"), "build: ## Build app")

      const source = new MakefileCommandSource({
        prompt_append: "\nName: {name}, Cmd: {command}"
      })
      const commands = await source.load({ rootDir: dir, logger: { warn: vi.fn() } })

      expect(commands[0].template).toBe("Use shell to execute `make build $ARGUMENTS`\nName: build, Cmd: make build")
    })
  })

  // === Config: prompt + prompt_append ===

  it("supports prompt_append after custom prompt", async () => {
    await withTempDir(async (dir) => {
      await writeText(
        join(dir, "Makefile"),
        "build: ## Build the app"
      )

      const source = new MakefileCommandSource({
        prompt: "Execute {name}",
        prompt_append: "\n\nNote: append this"
      })
      const commands = await source.load({ rootDir: dir, logger: { warn: vi.fn() } })

      expect(commands).toEqual([
        {
          name: "make:build",
          description: "Build the app",
          template: "Execute build\n\nNote: append this"
        }
      ])
    })
  })
})
