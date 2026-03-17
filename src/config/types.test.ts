import { describe, it, expect } from "vitest"
import type { CommandInjectConfig } from "./types"

describe("config types", () => {
  it("exports CommandInjectConfig type", () => {
    const config: CommandInjectConfig = {
      sources: {
        makefile: { disable: false },
        "npm-scripts": { disable: false },
        skill: { disable: false },
      },
    }
    expect(config).toBeDefined()
  })
})
