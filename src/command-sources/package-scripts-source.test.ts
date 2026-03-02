import { join } from "node:path"
import { describe, expect, it, vi } from "vitest"

import { PackageScriptsCommandSource } from "./package-scripts-source"
import { withTempDir, writeText } from "../test-utils/temp-dir"

describe("PackageScriptsCommandSource", () => {
  it("maps scripts to npm commands", async () => {
    await withTempDir(async (dir) => {
      await writeText(
        join(dir, "package.json"),
        JSON.stringify({ scripts: { test: "vitest", build: "tsc -p ." } })
      )

      const source = new PackageScriptsCommandSource()
      const commands = await source.load({ rootDir: dir, logger: { warn: vi.fn() } })

      expect(commands).toEqual([
        {
          name: "npm:test",
          description: "test",
          template: "Use shell to execute `npm run test -- $ARGUMENTS`"
        },
        {
          name: "npm:build",
          description: "build",
          template: "Use shell to execute `npm run build -- $ARGUMENTS`"
        }
      ])
    })
  })

  it("uses pnpm run template when project runner is pnpm", async () => {
    await withTempDir(async (dir) => {
      await writeText(
        join(dir, "package.json"),
        JSON.stringify({ packageManager: "pnpm@10.0.0", scripts: { test: "vitest" } })
      )

      const source = new PackageScriptsCommandSource()
      const commands = await source.load({ rootDir: dir, logger: { warn: vi.fn() } })

      expect(commands[0].template).toBe("Use shell to execute `pnpm run test -- $ARGUMENTS`")
    })
  })

  it("uses bun run template when project runner is bun", async () => {
    await withTempDir(async (dir) => {
      await writeText(join(dir, "package.json"), JSON.stringify({ scripts: { test: "vitest" } }))
      await writeText(join(dir, "bun.lockb"), "")

      const source = new PackageScriptsCommandSource()
      const commands = await source.load({ rootDir: dir, logger: { warn: vi.fn() } })

      expect(commands[0].template).toBe("Use shell to execute `bun run test -- $ARGUMENTS`")
    })
  })

  it("returns empty when package.json has no scripts", async () => {
    await withTempDir(async (dir) => {
      await writeText(join(dir, "package.json"), JSON.stringify({ name: "x" }))

      const source = new PackageScriptsCommandSource()
      const commands = await source.load({ rootDir: dir, logger: { warn: vi.fn() } })

      expect(commands).toEqual([])
    })
  })

  it("logs warning and returns empty on invalid JSON", async () => {
    await withTempDir(async (dir) => {
      await writeText(join(dir, "package.json"), "{ bad json")
      const warn = vi.fn<(message: string) => void>()

      const source = new PackageScriptsCommandSource()
      const commands = await source.load({ rootDir: dir, logger: { warn } })

      expect(commands).toEqual([])
      expect(warn).toHaveBeenCalledTimes(1)
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("package.json"))
    })
  })
})
