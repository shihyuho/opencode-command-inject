import { join } from "node:path"
import { describe, expect, it, vi } from "vitest"

import { NpmScriptsCommandSource } from "./npm-source"
import { withTempDir, writeText } from "../test-utils/temp-dir"

describe("NpmScriptsCommandSource", () => {
  it("maps scripts to npm commands", async () => {
    await withTempDir(async (dir) => {
      await writeText(
        join(dir, "package.json"),
        JSON.stringify({ scripts: { test: "vitest", build: "tsc -p ." } })
      )

      const source = new NpmScriptsCommandSource()
      const commands = await source.load({ rootDir: dir, logger: { warn: vi.fn() } })

      expect(commands).toEqual([
        { name: "npm:test", description: "test", template: "npm run test -- $ARGUMENTS" },
        { name: "npm:build", description: "build", template: "npm run build -- $ARGUMENTS" }
      ])
    })
  })

  it("returns empty when package.json has no scripts", async () => {
    await withTempDir(async (dir) => {
      await writeText(join(dir, "package.json"), JSON.stringify({ name: "x" }))

      const source = new NpmScriptsCommandSource()
      const commands = await source.load({ rootDir: dir, logger: { warn: vi.fn() } })

      expect(commands).toEqual([])
    })
  })

  it("logs warning and returns empty on invalid JSON", async () => {
    await withTempDir(async (dir) => {
      await writeText(join(dir, "package.json"), "{ bad json")
      const warn = vi.fn<(message: string) => void>()

      const source = new NpmScriptsCommandSource()
      const commands = await source.load({ rootDir: dir, logger: { warn } })

      expect(commands).toEqual([])
      expect(warn).toHaveBeenCalledTimes(1)
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("package.json"))
    })
  })
})
