import { describe, expect, it } from "vitest"

import { stripJsonComments } from "./strip-json-comments"

describe("stripJsonComments", () => {
  it("keeps strings ending with an escaped backslash and still strips following comments", () => {
    const escapedPath = JSON.stringify("C:\\")
    const input = [
      "{",
      `  "path": ${escapedPath}, // keep the trailing backslash`,
      '  "enabled": true',
      "}",
    ].join("\n")

    expect(stripJsonComments(input)).toBe([
      "{",
      `  "path": ${escapedPath}, `,
      '  "enabled": true',
      "}",
    ].join("\n"))
  })
})
