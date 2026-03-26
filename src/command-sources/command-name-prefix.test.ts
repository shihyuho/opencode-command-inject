import { describe, expect, it } from "vitest"
import { buildCommandName } from "./command-name-prefix"

describe("buildCommandName", () => {
  it("returns matching configured and canonical names when prefixing is effectively on", () => {
    expect(
      buildCommandName({
        name: "build",
        canonicalPrefix: "make",
      })
    ).toEqual({
      configuredName: "make:build",
      canonicalName: "make:build",
      usedCustomizedName: false,
    })
  })

  it("returns raw configured names with canonical fallback metadata when prefixing is disabled", () => {
    expect(
      buildCommandName({
        name: "build",
        canonicalPrefix: "make",
        globalCommandNamePrefix: {
          disable: true,
        },
      })
    ).toEqual({
      configuredName: "build",
      canonicalName: "make:build",
      usedCustomizedName: true,
    })

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
    ).toEqual({
      configuredName: "build",
      canonicalName: "make:build",
      usedCustomizedName: true,
    })
  })

  it("returns custom configured names and tracks canonical fallback metadata", () => {
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
    ).toEqual({
      configuredName: "maker:build",
      canonicalName: "make:build",
      usedCustomizedName: true,
    })

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
    ).toEqual({
      configuredName: "maker:build",
      canonicalName: "make:build",
      usedCustomizedName: true,
    })
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
    ).toEqual({
      configuredName: "build",
      canonicalName: "make:build",
      usedCustomizedName: false,
    })
  })

  it("keeps canonical fallback names for already namespaced command names", () => {
    expect(
      buildCommandName({
        name: "review:security",
        canonicalPrefix: "skill",
      })
    ).toEqual({
      configuredName: "skill:review:security",
      canonicalName: "skill:review:security",
      usedCustomizedName: false,
    })

    expect(
      buildCommandName({
        name: "review:security",
        canonicalPrefix: "skill",
        globalCommandNamePrefix: {
          disable: true,
        },
      })
    ).toEqual({
      configuredName: "review:security",
      canonicalName: "skill:review:security",
      usedCustomizedName: true,
    })
  })
})
