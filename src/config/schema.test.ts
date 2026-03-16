import { describe, it, expect } from "vitest"
import { CommandInjectConfigSchema } from "./schema"

describe("config schema", () => {
  it("validates valid config", () => {
    const result = CommandInjectConfigSchema.safeParse({
      sources: {
        makefile: { enabled: false },
      },
    })
    expect(result.success).toBe(true)
  })

  it("validates empty config", () => {
    const result = CommandInjectConfigSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("validates all source options", () => {
    const result = CommandInjectConfigSchema.safeParse({
      sources: {
        makefile: { enabled: true, prompt: "Custom prompt", prompt_append: "Append" },
        "npm-scripts": { enabled: false, prompt: "Another prompt" },
        skill: { enabled: true },
      },
    })
    expect(result.success).toBe(true)
  })
})
