import type { PathLike } from "node:fs"
import { describe, expect, it, vi } from "vitest"
import { detectPackageRunner } from "./package-runner"

vi.mock("node:fs/promises", () => {
  return {
    readFile: vi.fn(),
    stat: vi.fn(),
  }
})

describe("detectPackageRunner", () => {
  it("prefers packageManager field when present", async () => {
    const { readFile } = await import("node:fs/promises")
    vi.mocked(readFile).mockResolvedValueOnce(JSON.stringify({ packageManager: "pnpm@10.0.0" }))
    const runner = await detectPackageRunner("/mock-dir")
    expect(runner).toBe("pnpm")
  })

  it("falls back to lockfile when packageManager is missing", async () => {
    const { readFile, stat } = await import("node:fs/promises")
    vi.mocked(readFile).mockRejectedValueOnce({ code: "ENOENT" }) // no package.json
    vi.mocked(stat).mockImplementation(async (path: PathLike) => {
      if (String(path).endsWith("yarn.lock")) return {} as ReturnType<typeof stat>
      throw { code: "ENOENT" }
    })
    const runner = await detectPackageRunner("/mock-dir")
    expect(runner).toBe("yarn")
  })

  it("falls back to npm when nothing indicates a runner", async () => {
    const { readFile, stat } = await import("node:fs/promises")
    vi.mocked(readFile).mockRejectedValueOnce({ code: "ENOENT" }) // no package.json
    vi.mocked(stat).mockRejectedValue({ code: "ENOENT" }) // no lockfiles

    const runner = await detectPackageRunner("/mock-dir")
    expect(runner).toBe("npm")
  })
})
