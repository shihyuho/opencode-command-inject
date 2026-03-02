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

      expect(hooks).toHaveProperty("command.execute.before")
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
})
