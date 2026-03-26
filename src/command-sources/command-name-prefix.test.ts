import { describe, expect, it } from "vitest"
import { buildCommandName } from "./command-name-prefix"

describe("buildCommandName", () => {
  it("returns canonicalPrefix:name when prefixing is effectively on", () => {
    expect(
      buildCommandName({
        name: "build",
        canonicalPrefix: "make",
      })
    ).toBe("make:build")
  })

  it("returns raw name when global disable or source force-off disables prefixing", () => {
    expect(
      buildCommandName({
        name: "build",
        canonicalPrefix: "make",
        globalCommandNamePrefix: {
          disable: true,
        },
      })
    ).toBe("build")

    expect(
      buildCommandName({
        name: "build",
        canonicalPrefix: "make",
        sourceConfig: {
          command_name_prefix: {
            disable: true,
          },
        },
      })
    ).toBe("build")
  })

  it("returns value:name when source force-on or inherited-on uses a custom value", () => {
    expect(
      buildCommandName({
        name: "build",
        canonicalPrefix: "make",
        sourceConfig: {
          command_name_prefix: {
            value: "maker",
          },
        },
      })
    ).toBe("maker:build")

    expect(
      buildCommandName({
        name: "build",
        canonicalPrefix: "make",
        globalCommandNamePrefix: {
          disable: true,
        },
        sourceConfig: {
          command_name_prefix: {
            disable: false,
            value: "maker",
          },
        },
      })
    ).toBe("maker:build")
  })

  it("ignores value when global prefixing is off and source does not explicitly force-on", () => {
    expect(
      buildCommandName({
        name: "build",
        canonicalPrefix: "make",
        globalCommandNamePrefix: {
          disable: true,
        },
        sourceConfig: {
          command_name_prefix: {
            value: "maker",
          },
        },
      })
    ).toBe("build")
  })
})
