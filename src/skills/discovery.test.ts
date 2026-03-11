import { join } from "node:path"
import { describe, expect, it, vi } from "vitest"
import { discoverSkills, getSkillRoots } from "./discovery"
import { mkdir, withTempDir, writeText } from "../test-utils/temp-dir"

async function writeSkill(root: string, skillName: string, content: string): Promise<void> {
  const dir = join(root, skillName)
  await mkdir(dir)
  await writeText(join(dir, "SKILL.md"), content)
}

describe("getSkillRoots", () => {
  it("returns roots in priority order", () => {
    const roots = getSkillRoots("/project", "/home/test")

    expect(roots).toEqual([
      "/project/.opencode/skills",
      "/home/test/.config/opencode/skills",
      "/project/.claude/skills",
      "/project/.agents/skills",
      "/home/test/.claude/skills",
      "/home/test/.agents/skills",
    ])
  })
})

describe("discoverSkills", () => {
  it("discovers skills from roots in priority order", async () => {
    await withTempDir(async (dir) => {
      const rootA = join(dir, "a")
      const rootB = join(dir, "b")
      await mkdir(rootA)
      await mkdir(rootB)
      await writeSkill(rootA, "alpha", "---\ndescription: Alpha\n---\n\nBody A")
      await writeSkill(rootB, "beta", "---\ndescription: Beta\n---\n\nBody B")

      const result = await discoverSkills({
        projectRoot: dir,
        roots: [rootA, rootB],
        logger: { warn: vi.fn() },
      })

      expect(result.map((item) => item.name)).toEqual(["alpha", "beta"])
    })
  })

  it("keeps the highest priority duplicate and warns with source paths", async () => {
    await withTempDir(async (dir) => {
      const high = join(dir, "high")
      const low = join(dir, "low")
      const warn = vi.fn<(message: string) => void>()
      await mkdir(high)
      await mkdir(low)
      await writeSkill(high, "review", "---\ndescription: High\n---\n\nHigh body")
      await writeSkill(low, "review", "---\ndescription: Low\n---\n\nLow body")

      const result = await discoverSkills({
        projectRoot: dir,
        roots: [high, low],
        logger: { warn },
      })

      expect(result).toHaveLength(1)
      expect(result[0].description).toBe("High")
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("duplicate discovered skill 'review'")
      )
      expect(warn).toHaveBeenCalledWith(expect.stringContaining(join(high, "review", "SKILL.md")))
      expect(warn).toHaveBeenCalledWith(expect.stringContaining(join(low, "review", "SKILL.md")))
    })
  })

  it("skips missing roots and missing SKILL.md", async () => {
    await withTempDir(async (dir) => {
      const existing = join(dir, "existing")
      const missing = join(dir, "missing")
      await mkdir(existing)
      await mkdir(join(existing, "empty-dir"))
      await writeSkill(existing, "valid", "Body")

      const result = await discoverSkills({
        projectRoot: dir,
        roots: [missing, existing],
        logger: { warn: vi.fn() },
      })

      expect(result.map((item) => item.name)).toEqual(["valid"])
    })
  })
})
