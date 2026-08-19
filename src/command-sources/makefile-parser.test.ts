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

  it("extracts target and description when there are dependencies", () => {
    const items = parseMakefile(
      [
        "compile: clean  ## Clean and compile the source code.",
        "redeploy: undeploy deploy ## Redeploy to Kubernetes specified in ~/.kube/config."
      ].join("\n")
    )
    expect(items).toEqual([
      { target: "compile", description: "Clean and compile the source code." },
      { target: "redeploy", description: "Redeploy to Kubernetes specified in ~/.kube/config." }
    ])
  })

  it("collapses split declarations for the same target", () => {
    const items = parseMakefile(
      [
        "deploy-web: COMPONENTS := config api",
        "deploy-web: deploy"
      ].join("\n")
    )

    expect(items).toEqual([
      { target: "deploy-web", description: "deploy-web" }
    ])
  })

  it("uses the first explicit description across split declarations", () => {
    const items = parseMakefile(
      [
        "deploy-web: COMPONENTS := config api",
        "deploy-web: deploy ## Deploy web components",
        "deploy-web: verify ## Ignore later descriptions"
      ].join("\n")
    )

    expect(items).toEqual([
      { target: "deploy-web", description: "Deploy web components" }
    ])
  })
})
