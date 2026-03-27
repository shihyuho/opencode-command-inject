import { describe, expect, it } from "vitest"
import { buildCommandName } from "./command-name-prefix"

describe("buildCommandName", () => {
  describe("TEST-01 no-config defaults keep canonical published names", () => {
    it("keeps canonical names for make, npm runner, and skill commands when config is omitted", () => {
      expect(buildCommandName({ name: "build", canonicalPrefix: "make" })).toEqual({
        configuredName: "make:build",
        canonicalName: "make:build",
        usedCustomizedName: false,
      })

      expect(buildCommandName({ name: "test", canonicalPrefix: "pnpm" })).toEqual({
        configuredName: "pnpm:test",
        canonicalName: "pnpm:test",
        usedCustomizedName: false,
      })

      expect(buildCommandName({ name: "review", canonicalPrefix: "skill" })).toEqual({
        configuredName: "skill:review",
        canonicalName: "skill:review",
        usedCustomizedName: false,
      })
    })
  })

  describe("TEST-02 global disable with source-specific override behavior", () => {
    it("drops prefixes globally but lets a source force canonical naming back on", () => {
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
          globalCommandNamePrefix: {
            disable: true,
          },
          sourceConfig: {
            command_name_prefix: {
              disable: false,
            },
          },
        })
      ).toEqual({
        configuredName: "make:build",
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

    it("ignores value when global disable is active but the source never forces prefixing back on", () => {
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
  })

  describe("TEST-03 per-source custom prefixes stay in prefix:name format", () => {
    it("renders custom prefixes and preserves nested skill namespaces", () => {
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

      expect(
        buildCommandName({
          name: "review:security",
          canonicalPrefix: "skill",
          sourceConfig: {
            command_name_prefix: {
              value: "custom",
            },
          },
        })
      ).toEqual({
        configuredName: "custom:review:security",
        canonicalName: "skill:review:security",
        usedCustomizedName: true,
      })
    })

    it("keeps canonical fallback metadata for nested skill names when global prefixes are disabled", () => {
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
})
