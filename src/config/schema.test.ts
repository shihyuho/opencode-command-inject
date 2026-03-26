import { describe, it, expect } from "vitest"
import { CommandInjectConfigSchema } from "./schema"

describe("config schema", () => {
  it("validates top-level command_name_prefix.disable", () => {
    const result = CommandInjectConfigSchema.safeParse({
      command_name_prefix: {
        disable: true,
      },
    })

    expect(result.success).toBe(true)
  })

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
      command_name_prefix: {
        disable: false,
      },
      sources: {
        makefile: {
          disable: true,
          prompt: "Custom prompt",
          prompt_append: "Append",
          command_name_prefix: {
            disable: false,
            value: "maker",
          },
        },
        "npm-scripts": { disable: false, prompt: "Another prompt" },
        skill: {
          disable: true,
          command_name_prefix: {
            disable: true,
          },
        },
      },
    })
    expect(result.success).toBe(true)
  })

  it("rejects top-level command_name_prefix.value", () => {
    const result = CommandInjectConfigSchema.safeParse({
      command_name_prefix: {
        disable: false,
        value: "custom",
      },
    })

    expect(result.success).toBe(false)
  })
})
