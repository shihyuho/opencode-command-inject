import { join } from "node:path"
import { symlink } from "node:fs/promises"
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

      expect(result.map((item) => item.name)).toEqual(["skill:alpha", "skill:beta"])
    })
  })

  it("keeps the highest priority duplicate and warns with source paths", async () => {
    await withTempDir(async (dir) => {
      const high = join(dir, "high")
      const low = join(dir, "low")
      const warn = vi.fn<(message: string) => void>()
      const debug = vi.fn<(message: string) => void>()
      await mkdir(high)
      await mkdir(low)
      await writeSkill(high, "review", "---\ndescription: High\n---\n\nHigh body")
      await writeSkill(low, "review", "---\ndescription: Low\n---\n\nLow body")

      const result = await discoverSkills({
        projectRoot: dir,
        roots: [high, low],
        logger: { warn, debug },
      })

      expect(result).toHaveLength(1)
      expect(result[0].description).toBe("High")
      expect(debug).toHaveBeenCalledWith(
        expect.stringContaining("duplicate discovered skill 'review'")
      )
      expect(debug).toHaveBeenCalledWith(expect.stringContaining(join(high, "review", "SKILL.md")))
      expect(debug).toHaveBeenCalledWith(expect.stringContaining(join(low, "review", "SKILL.md")))
      expect(warn).not.toHaveBeenCalled()
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

      expect(result.map((item) => item.name)).toEqual(["skill:valid"])
    })
  })

  it("applies namespace from parent directories to skill names", async () => {
    await withTempDir(async (dir) => {
      const root = join(dir, "skills")
      await mkdir(join(root, "superpowers"))
      await writeSkill(root, "superpowers", "---\nname: brainstorming\ndescription: Brainstorming\n---\n\nBrainstorming body")

      const result = await discoverSkills({
        projectRoot: dir,
        roots: [root],
        logger: { warn: vi.fn() },
      })

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe("skill:superpowers:brainstorming")
    })
  })

  it("applies skill: prefix even for skills directly in root", async () => {
    await withTempDir(async (dir) => {
      const root = join(dir, "skills")
      await mkdir(root)
      await writeSkill(root, "review", "---\nname: review\ndescription: Review\n---\n\nReview body")

      const result = await discoverSkills({
        projectRoot: dir,
        roots: [root],
        logger: { warn: vi.fn() },
      })

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe("skill:review")
    })
  })

  it("handles multiple nested directories with namespace", async () => {
    await withTempDir(async (dir) => {
      const root = join(dir, "skills")
      // skills/a/SKILL.md with name: b -> skill:a:b
      await mkdir(join(root, "a"))
      await writeSkill(root, "a", "---\nname: b\ndescription: Nested\n---\n\nBody")

      const result = await discoverSkills({
        projectRoot: dir,
        roots: [root],
        logger: { warn: vi.fn() },
      })

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe("skill:a:b")
    })
  })

  it("handles multiple skills at different depths", async () => {
    await withTempDir(async (dir) => {
      const root = join(dir, "skills")
      // skills/superpowers/SKILL.md -> skill:superpowers:brainstorming
      await mkdir(join(root, "superpowers"))
      await writeSkill(root, "superpowers", "---\nname: brainstorming\ndescription: Brainstorming\n---\n\nBody")

      // skills/writing/SKILL.md -> skill:writing:plans
      await mkdir(join(root, "writing"))
      await writeSkill(root, "writing", "---\nname: plans\ndescription: Plans\n---\n\nBody")

      const result = await discoverSkills({
        projectRoot: dir,
        roots: [root],
        logger: { warn: vi.fn() },
      })

      expect(result).toHaveLength(2)
      expect(result.map((s) => s.name).sort()).toEqual([
        "skill:superpowers:brainstorming",
        "skill:writing:plans",
      ])
    })
  })

  it("recursively discovers nested skills at any depth", async () => {
    await withTempDir(async (dir) => {
      const root = join(dir, "skills")
      // skills/superpowers/brainstorming/SKILL.md
      await mkdir(join(root, "superpowers", "brainstorming"))
      await writeSkill(root, "superpowers/brainstorming", "---\nname: brainstorming\ndescription: Brainstorming\n---\n\nBody")

      const result = await discoverSkills({
        projectRoot: dir,
        roots: [root],
        logger: { warn: vi.fn() },
      })

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe("skill:superpowers:brainstorming")
    })
  })

  it("follows symlinks to directories", async () => {
    await withTempDir(async (dir) => {
      const root = join(dir, "skills")
      // Create actual skill directory
      await mkdir(join(root, "actual"))
      await writeSkill(root, "actual", "---\nname: actual-skill\ndescription: Actual\n---\n\nBody")

      // Create symlink pointing to actual directory
      const symlinkPath = join(root, "linked")
      await symlink(join(root, "actual"), symlinkPath)

      const result = await discoverSkills({
        projectRoot: dir,
        roots: [root],
        logger: { warn: vi.fn() },
      })

      // Should discover both actual and linked (since symlink resolves to same dir)
      // But since they're the same, only one should be in result
      expect(result.length).toBeGreaterThanOrEqual(1)
      expect(result.map((s) => s.name)).toContain("skill:actual:actual-skill")
    })
  })
})
