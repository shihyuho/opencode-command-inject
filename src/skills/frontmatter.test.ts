import { describe, expect, it } from "vitest"
import { mkdir, writeText, withTempDir } from "../test-utils/temp-dir"
import { parseFrontmatter } from "./frontmatter"
import { loadSkill } from "./load-skill"

describe("parseFrontmatter", () => {
  it("parses content with frontmatter", () => {
    const result = parseFrontmatter(`---
name: My Skill
description: A test skill
---

# My Skill Content

This is the skill body.`)

    expect(result).toEqual({
      name: "My Skill",
      description: "A test skill",
      body: "# My Skill Content\n\nThis is the skill body.",
    })
  })

  it("supports quoted scalar values and colons in description", () => {
    const result = parseFrontmatter(`---
name: "Quoted Skill"
description: "A skill: with colon"
---

# Body`)

    expect(result).toEqual({
      name: "Quoted Skill",
      description: "A skill: with colon",
      body: "# Body",
    })
  })

  it("supports block scalar descriptions", () => {
    const result = parseFrontmatter(`---
name: Block Skill
description: |
  First line
  Second line
---

Body`)

    expect(result).toEqual({
      name: "Block Skill",
      description: "First line\nSecond line",
      body: "Body",
    })
  })

  it("supports folded block scalar descriptions", () => {
    const result = parseFrontmatter(`---
name: Folded Skill
description: >-
  First line
  Second line

  Third paragraph
---

Body`)

    expect(result).toEqual({
      name: "Folded Skill",
      description: "First line Second line\n\nThird paragraph",
      body: "Body",
    })
  })

  it("parses content without frontmatter", () => {
    const result = parseFrontmatter(`# My Skill Content

This is the skill body.`)

    expect(result).toEqual({
      name: undefined,
      description: undefined,
      body: "# My Skill Content\n\nThis is the skill body.",
    })
  })

  it("returns empty body when content body is blank", () => {
    const result = parseFrontmatter(`---
name: My Skill
description: A test skill
---

`)

    expect(result).toEqual({
      name: "My Skill",
      description: "A test skill",
      body: "",
    })
  })

  it("ignores unsupported frontmatter keys", () => {
    const result = parseFrontmatter(`---
name: Basic Skill
model: sonnet
allowed-tools: [read]
description: Valid description
---

Body`)

    expect(result).toEqual({
      name: "Basic Skill",
      description: "Valid description",
      body: "Body",
    })
  })
})

describe("loadSkill", () => {
  it("loads skill with frontmatter and produces valid LoadedSkillCommandInput", async () => {
    await withTempDir(async (dir) => {
      const skillDir = `${dir}/test-skill`
      await mkdir(skillDir)
      await writeText(
        `${skillDir}/SKILL.md`,
        `---
name: Test Skill
description: A test skill description
---

# Instructions

Use this skill to test.`
      )

      const result = await loadSkill(skillDir)
      expect(result).not.toBeNull()
      expect(result).toEqual({
        name: "Test Skill",
        description: "A test skill description",
        template: `<skill-instruction>
# Instructions

Use this skill to test.
</skill-instruction>

<user-request>
$ARGUMENTS
</user-request>`,
        sourcePath: `${skillDir}/SKILL.md`,
      })
    })
  })

  it("falls back to directory name when name is missing in frontmatter", async () => {
    await withTempDir(async (dir) => {
      const skillDir = `${dir}/my-fallback-skill`
      await mkdir(skillDir)
      await writeText(
        `${skillDir}/SKILL.md`,
        `---
description: A skill with fallback name
---

# Body content`
      )

      const result = await loadSkill(skillDir)
      expect(result).not.toBeNull()
      expect(result?.name).toBe("my-fallback-skill")
    })
  })

  it("falls back to name when description is missing in frontmatter", async () => {
    await withTempDir(async (dir) => {
      const skillDir = `${dir}/description-fallback`
      await mkdir(skillDir)
      await writeText(
        `${skillDir}/SKILL.md`,
        `---
name: Description Fallback
---

# Body content`
      )

      const result = await loadSkill(skillDir)
      expect(result).not.toBeNull()
      expect(result?.description).toBe("Description Fallback")
    })
  })

  it("returns null when body is empty", async () => {
    await withTempDir(async (dir) => {
      const skillDir = `${dir}/empty-body-skill`
      await mkdir(skillDir)
      await writeText(
        `${skillDir}/SKILL.md`,
        `---
name: Empty Body Skill
description: Has empty body
---

`
      )

      const result = await loadSkill(skillDir)
      expect(result).toBeNull()
    })
  })

  it("returns null when SKILL.md does not exist", async () => {
    await withTempDir(async (dir) => {
      const skillDir = `${dir}/nonexistent-skill`
      const result = await loadSkill(skillDir)
      expect(result).toBeNull()
    })
  })

  it("handles SKILL.md without frontmatter using directory name", async () => {
    await withTempDir(async (dir) => {
      const skillDir = `${dir}/no-frontmatter-skill`
      await mkdir(skillDir)
      await writeText(
        `${skillDir}/SKILL.md`,
        `# No Frontmatter

Some skill content here.`
      )

      const result = await loadSkill(skillDir)
      expect(result).not.toBeNull()
      expect(result?.name).toBe("no-frontmatter-skill")
      expect(result?.description).toBe("no-frontmatter-skill")
      expect(result?.template).toContain("<skill-instruction>")
      expect(result?.template).toContain("<user-request>")
    })
  })
})
