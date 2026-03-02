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
        { name: "make:build", description: "Build app", template: "make build $ARGUMENTS" },
        { name: "make:test", description: "test", template: "make test $ARGUMENTS" }
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
})
