import { describe, expect, it } from "vitest"

import { parseMakefile } from "./makefile-parser"

describe("parseMakefile", () => {
  it("extracts target and ## description", () => {
    const items = parseMakefile("build: ## Build app")
    expect(items).toEqual([{ target: "build", description: "Build app" }])
  })

  it("falls back to target when no description", () => {
    const items = parseMakefile("lint:")
    expect(items).toEqual([{ target: "lint", description: "lint" }])
  })

  it("ignores invalid and special lines", () => {
    const items = parseMakefile(
      [
        "# comment",
        ".PHONY: build",
        "build: ## Build",
        "\techo done",
        "",
        "VAR = 1"
      ].join("\n")
    )

    expect(items).toEqual([{ target: "build", description: "Build" }])
  })
})
