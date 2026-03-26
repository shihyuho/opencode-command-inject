import { describe, expect, it, vi } from "vitest"

import { aggregateCommandSources } from "./aggregator"
import type { CommandInfo, CommandSource, LoadContext } from "./types"

function createSource(id: string, commands: CommandInfo[]): CommandSource {
  return {
    id,
    async load() {
      return commands
    },
  }
}

describe("aggregateCommandSources", () => {
  it("falls back an actual customized collision group to canonical names", async () => {
    const warn = vi.fn<(message: string) => void>()
    const context: LoadContext = { rootDir: "/tmp/project", logger: { warn } }

    const result = await aggregateCommandSources(
      [
        createSource("makefile", [
          {
            name: "build",
            canonicalName: "make:build",
            usedCustomizedName: true,
            sourceId: "makefile",
            description: "from makefile",
            template: "make build $ARGUMENTS",
          },
        ]),
        createSource("npm-scripts", [
          {
            name: "build",
            canonicalName: "pnpm:build",
            usedCustomizedName: true,
            sourceId: "npm-scripts",
            description: "from npm",
            template: "pnpm run build -- $ARGUMENTS",
          },
        ]),
      ],
      context
    )

    expect(result.map((command) => command.name)).toEqual(["make:build", "pnpm:build"])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("[command-sources]"))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("customized command name collision on 'build'"))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("makefile"))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("npm-scripts"))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("make:build"))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("pnpm:build"))
  })

  it("falls back only the collision group and leaves unrelated commands unchanged", async () => {
    const warn = vi.fn<(message: string) => void>()
    const context: LoadContext = { rootDir: "/tmp/project", logger: { warn } }

    const result = await aggregateCommandSources(
      [
        createSource("makefile", [
          {
            name: "build",
            canonicalName: "make:build",
            usedCustomizedName: true,
            sourceId: "makefile",
            description: "from makefile",
            template: "make build $ARGUMENTS",
          },
          {
            name: "maker:test",
            canonicalName: "make:test",
            usedCustomizedName: true,
            sourceId: "makefile",
            description: "test from makefile",
            template: "make test $ARGUMENTS",
          },
        ]),
        createSource("npm-scripts", [
          {
            name: "build",
            canonicalName: "pnpm:build",
            usedCustomizedName: true,
            sourceId: "npm-scripts",
            description: "from npm",
            template: "pnpm run build -- $ARGUMENTS",
          },
          {
            name: "package:test",
            canonicalName: "pnpm:test",
            usedCustomizedName: true,
            sourceId: "npm-scripts",
            description: "test from npm",
            template: "pnpm run test -- $ARGUMENTS",
          },
        ]),
      ],
      context
    )

    expect(result.map((command) => command.name)).toEqual([
      "make:build",
      "maker:test",
      "pnpm:build",
      "package:test",
    ])
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it("keeps first when canonical fallback still collides and warns it was attempted", async () => {
    const warn = vi.fn<(message: string) => void>()
    const context: LoadContext = { rootDir: "/tmp/project", logger: { warn } }

    const result = await aggregateCommandSources(
      [
        createSource("skill-a", [
          {
            name: "review",
            canonicalName: "skill:review",
            usedCustomizedName: true,
            sourceId: "skill-a",
            description: "review A",
            template: "do a $ARGUMENTS",
          },
        ]),
        createSource("skill-b", [
          {
            name: "review",
            canonicalName: "skill:review",
            usedCustomizedName: true,
            sourceId: "skill-b",
            description: "review B",
            template: "do b $ARGUMENTS",
          },
        ]),
      ],
      context
    )

    expect(result).toHaveLength(1)
    expect(result[0]?.description).toBe("review A")
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("attempted canonical fallback"))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("keeping first"))
  })
})
