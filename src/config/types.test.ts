import { describe, it, expect } from "vitest"
import type { CommandInjectConfig } from "./types"

describe("config types", () => {
  it("exports CommandInjectConfig type", () => {
    const config: CommandInjectConfig = {
      sources: {
        makefile: { enabled: true },
        "npm-scripts": { enabled: true },
        skill: { enabled: true },
      },
    }
    expect(config).toBeDefined()
  })
})
