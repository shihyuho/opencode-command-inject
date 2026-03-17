import { describe, it, expect } from "vitest"
import { CommandInjectConfigSchema } from "./schema"

describe("config schema", () => {
  it("validates valid config", () => {
    const result = CommandInjectConfigSchema.safeParse({
      sources: {
        makefile: { disable: false },
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
        makefile: { disable: true, prompt: "Custom prompt", prompt_append: "Append" },
        "npm-scripts": { disable: false, prompt: "Another prompt" },
        skill: { disable: true },
      },
    })
    expect(result.success).toBe(true)
  })
})
