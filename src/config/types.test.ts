import { describe, it, expect, expectTypeOf } from "vitest"
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

  it("keeps top-level command_name_prefix disable-only", () => {
    expectTypeOf<CommandInjectConfig["command_name_prefix"]>().toEqualTypeOf<
      | {
          disable?: boolean
        }
      | undefined
    >()
  })

  it("exposes per-source command_name_prefix disable and value fields", () => {
    expectTypeOf<CommandInjectConfig["sources"]>().toEqualTypeOf<
      | {
          makefile?: {
            disable?: boolean
            prompt?: string
            prompt_append?: string
            command_name_prefix?: {
              disable?: boolean
              value?: string
            }
          }
          "npm-scripts"?: {
            disable?: boolean
            prompt?: string
            prompt_append?: string
            command_name_prefix?: {
              disable?: boolean
              value?: string
            }
          }
          skill?: {
            disable?: boolean
            prompt?: string
            prompt_append?: string
            command_name_prefix?: {
              disable?: boolean
              value?: string
            }
          }
        }
      | undefined
    >()
  })
})
