import { join } from "node:path"
import { describe, expect, it, vi } from "vitest"

import { buildCommandCatalog } from "./executor"
import type { CommandInfo } from "../../features/command-sources"
import { withTempDir, writeText } from "../../test-utils/temp-dir"

function names(commands: CommandInfo[]): string[] {
  return commands.map((command) => command.name)
}

describe("buildCommandCatalog", () => {
  it("injects make and npm commands during startup", async () => {
    await withTempDir(async (dir) => {
      await writeText(join(dir, "Makefile"), "build: ## Build app")
      await writeText(join(dir, "package.json"), JSON.stringify({ scripts: { test: "vitest" } }))

      const commands = await buildCommandCatalog({
        rootDir: dir,
        logger: { warn: vi.fn() },
        existingCommands: [{ name: "skill:demo", description: "demo", template: "demo $ARGUMENTS" }]
      })

      expect(names(commands)).toContain("make:build")
      expect(names(commands)).toContain("npm:test")
      expect(names(commands)).toContain("skill:demo")
    })
  })

  it("does not overwrite existing command on conflict", async () => {
    await withTempDir(async (dir) => {
      await writeText(join(dir, "Makefile"), "build: ## Build app")
      const warn = vi.fn<(message: string) => void>()

      const commands = await buildCommandCatalog({
        rootDir: dir,
        logger: { warn },
        existingCommands: [{ name: "make:build", description: "existing", template: "custom build" }]
      })

      expect(commands.find((cmd) => cmd.name === "make:build")?.description).toBe("existing")
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("make:build"))
    })
  })
})
