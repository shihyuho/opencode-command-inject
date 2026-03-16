import { describe, expect, it, vi } from "vitest"

import { SkillCommandSource } from "./skill-source"
import type { LoadedSkillCommandInput, SourceConfig } from "./types"

describe("SkillCommandSource", () => {
  it("converts loaded skills to skill:<name> commands", async () => {
    const loadedSkills: LoadedSkillCommandInput[] = [
      { name: "greet", description: "Greet someone", template: "echo hello $ARGUMENTS" },
      { name: "farewell", description: "Say goodbye", template: "echo goodbye $ARGUMENTS" },
    ]

    const source = new SkillCommandSource(loadedSkills)
    const commands = await source.load({ rootDir: "/fake", logger: { warn: vi.fn() } })

    expect(commands).toHaveLength(2)
    expect(commands[0].name).toBe("skill:greet")
    expect(commands[0].description).toBe("Greet someone")
    expect(commands[1].name).toBe("skill:farewell")
    expect(commands[1].description).toBe("Say goodbye")
  })

  it("falls back description to name when missing", async () => {
    const loadedSkills: LoadedSkillCommandInput[] = [
      { name: "hello", template: "echo hello $ARGUMENTS" },
    ]

    const source = new SkillCommandSource(loadedSkills)
    const commands = await source.load({ rootDir: "/fake", logger: { warn: vi.fn() } })

    expect(commands).toHaveLength(1)
    expect(commands[0].name).toBe("skill:hello")
    expect(commands[0].description).toBe("hello")
  })

  it("skips blank names and logs warning", async () => {
    const warn = vi.fn<(message: string) => void>()
    const loadedSkills: LoadedSkillCommandInput[] = [
      { name: "valid", description: "Valid skill", template: "echo valid $ARGUMENTS" },
      { name: "", description: "Empty name", template: "echo empty $ARGUMENTS" },
      { name: "   ", description: "Whitespace name", template: "echo whitespace $ARGUMENTS" },
    ]

    const source = new SkillCommandSource(loadedSkills)
    const commands = await source.load({ rootDir: "/fake", logger: { warn } })

    expect(commands).toHaveLength(1)
    expect(commands[0].name).toBe("skill:valid")
    expect(warn).toHaveBeenCalledTimes(2)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("blank"))
  })

  it("returns empty array when no loaded skills provided", async () => {
    const source = new SkillCommandSource([])
    const commands = await source.load({ rootDir: "/fake", logger: { warn: vi.fn() } })

    expect(commands).toHaveLength(0)
  })

  describe("prefix normalization", () => {
    const testCases = [
      { name: "skill:greet", expected: "skill:greet", description: "removes 'skill:' if already present" },
      { name: "skill: greet", expected: "skill:greet", description: "removes 'skill: ' with space" },
      { name: "SKILL:greet", expected: "skill:greet", description: "case insensitive prefix removal" },
    ]

    it.each(testCases)("normalizes skill name: $description", async ({ name, expected }) => {
      const loadedSkills: LoadedSkillCommandInput[] = [
        { name, description: "Test skill", template: "echo $ARGUMENTS" },
      ]

      const source = new SkillCommandSource(loadedSkills)
      const commands = await source.load({ rootDir: "/fake", logger: { warn: vi.fn() } })

      expect(commands).toHaveLength(1)
      expect(commands[0].name).toBe(expected)
    })
  })

  it("warns when skill name becomes blank after normalization", async () => {
    const warn = vi.fn<(message: string) => void>()
    const loadedSkills: LoadedSkillCommandInput[] = [
      { name: "skill:", description: "Only prefix", template: "echo $ARGUMENTS" },
    ]

    const source = new SkillCommandSource(loadedSkills)
    const commands = await source.load({ rootDir: "/fake", logger: { warn } })

    expect(commands).toHaveLength(0)
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("skipping skill with blank name after normalization")
    )
  })

  it("deduplicates normalized names: keeps first, warns on duplicate", async () => {
    const warn = vi.fn<(message: string) => void>()
    const loadedSkills: LoadedSkillCommandInput[] = [
      { name: "greet", description: "First greet", template: "echo first $ARGUMENTS" },
      { name: "skill:greet", description: "Second greet", template: "echo second $ARGUMENTS" },
    ]

    const source = new SkillCommandSource(loadedSkills)
    const commands = await source.load({ rootDir: "/fake", logger: { warn } })

    // Should only have one command, keeping the first one
    expect(commands).toHaveLength(1)
    expect(commands[0].name).toBe("skill:greet")
    expect(commands[0].description).toBe("First greet")
    expect(commands[0].template).toBe("echo first $ARGUMENTS")

    // Should warn about duplicate
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("duplicate")
    )
  })

  describe("with SourceConfig", () => {
    it("uses custom prompt with variable substitution", async () => {
      const loadedSkills: LoadedSkillCommandInput[] = [
        { name: "build", template: "Build the project", description: "Build skill" },
      ]

      const config: SourceConfig = {
        prompt: "Skill: {name}\nDescription: {description}\nInstruction: {instruction}",
      }

      const source = new SkillCommandSource(loadedSkills, config)
      const commands = await source.load({ rootDir: "/fake", logger: { warn: vi.fn() } })

      expect(commands).toHaveLength(1)
      expect(commands[0].template).toBe(
        "Skill: build\nDescription: Build skill\nInstruction: Build the project"
      )
    })

    it("supports prompt_append", async () => {
      const loadedSkills: LoadedSkillCommandInput[] = [
        { name: "build", template: "Build", description: "Build skill" },
      ]

      const config: SourceConfig = {
        prompt: "{name}",
        prompt_append: "\n\nNote: append this",
      }

      const source = new SkillCommandSource(loadedSkills, config)
      const commands = await source.load({ rootDir: "/fake", logger: { warn: vi.fn() } })

      expect(commands).toHaveLength(1)
      expect(commands[0].template).toBe("build\n\nNote: append this")
    })

    it("substitutes {arguments} placeholder", async () => {
      const loadedSkills: LoadedSkillCommandInput[] = [
        { name: "run", template: "Run command", description: "Run skill" },
      ]

      const config: SourceConfig = {
        prompt: "Do: {arguments}",
      }

      const source = new SkillCommandSource(loadedSkills, config)
      const commands = await source.load({ rootDir: "/fake", logger: { warn: vi.fn() } })

      expect(commands).toHaveLength(1)
      expect(commands[0].template).toBe("Do: $ARGUMENTS")
    })
  })
})
