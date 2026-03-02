import type { PathLike } from "node:fs"
import { describe, expect, it, vi } from "vitest"
import { detectPackageManager } from "./package-manager"

vi.mock("node:fs/promises", () => {
  return {
    readFile: vi.fn(),
    stat: vi.fn(),
  }
})

describe("detectPackageManager", () => {
  it("prefers packageManager field when present", async () => {
    const { readFile } = await import("node:fs/promises")
    vi.mocked(readFile).mockResolvedValueOnce(JSON.stringify({ packageManager: "pnpm@10.0.0" }))
    const manager = await detectPackageManager("/mock-dir")
    expect(manager).toBe("pnpm")
  })

  it("falls back to lockfile when packageManager is missing", async () => {
    const { readFile, stat } = await import("node:fs/promises")
    vi.mocked(readFile).mockRejectedValueOnce({ code: "ENOENT" }) // no package.json
    vi.mocked(stat).mockImplementation(async (path: PathLike) => {
      if (String(path).endsWith("yarn.lock")) return {} as ReturnType<typeof stat>
      throw { code: "ENOENT" }
    })
    const manager = await detectPackageManager("/mock-dir")
    expect(manager).toBe("yarn")
  })

  it("falls back to npm when nothing indicates a runner", async () => {
    const { readFile, stat } = await import("node:fs/promises")
    vi.mocked(readFile).mockRejectedValueOnce({ code: "ENOENT" }) // no package.json
    vi.mocked(stat).mockRejectedValue({ code: "ENOENT" }) // no lockfiles

    const manager = await detectPackageManager("/mock-dir")
    expect(manager).toBe("npm")
  })
})
