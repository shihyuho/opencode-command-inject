import { describe, expect, it, vi } from "vitest"

import { aggregateCommandSources } from "./aggregator"
import type { CommandSource, LoadContext } from "./types"

describe("aggregateCommandSources", () => {
  it("keeps first command on name conflict and logs warning", async () => {
    const warn = vi.fn<(message: string) => void>()
    const context: LoadContext = { rootDir: "/tmp/project", logger: { warn } }

    const sourceA: CommandSource = {
      id: "A",
      async load() {
        return [
          { name: "make:build", description: "from A", template: "make build $ARGUMENTS" }
        ]
      }
    }

    const sourceB: CommandSource = {
      id: "B",
      async load() {
        return [
          { name: "make:build", description: "from B", template: "make build $ARGUMENTS" }
        ]
      }
    }

    const result = await aggregateCommandSources([sourceA, sourceB], context)

    expect(result.find((cmd) => cmd.name === "make:build")?.description).toBe("from A")
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("make:build"))
  })
})
