
import { join } from "node:path"

import { describe, expect, it, vi, beforeEach } from "vitest"
import { detectPackageRunner } from "./package-runner"

vi.mock("node:fs/promises", () => {
    return {
        readFile: vi.fn(),
        stat: vi.fn(),
    }
})

describe("detectPackageRunner", () => {
    let readFileMock: any
    let statMock: any

    beforeEach(async () => {
        vi.resetAllMocks()
        const fs = await import("node:fs/promises")
        readFileMock = fs.readFile
        statMock = fs.stat
    })

    it("prefers packageManager field when present", async () => {
        readFileMock.mockResolvedValueOnce(JSON.stringify({ packageManager: "pnpm@10.0.0" }))
        const runner = await detectPackageRunner("/mock-dir")
        expect(runner).toBe("pnpm")
    })

    it("falls back to lockfile when packageManager is missing", async () => {
        readFileMock.mockRejectedValueOnce({ code: "ENOENT" }) // no package.json
        statMock.mockImplementation(async (path: string) => {
            if (path.endsWith("yarn.lock")) return {}
            throw { code: "ENOENT" }
        })
        const runner = await detectPackageRunner("/mock-dir")
        expect(runner).toBe("yarn")
    })

    it("falls back to npm when nothing indicates a runner", async () => {
        readFileMock.mockRejectedValueOnce({ code: "ENOENT" }) // no package.json
        statMock.mockRejectedValue({ code: "ENOENT" }) // no lockfiles

        const runner = await detectPackageRunner("/mock-dir")
        expect(runner).toBe("npm")
    })
})
