function isEscaped(content: string, index: number): boolean {
  let backslashCount = 0

  for (let i = index - 1; i >= 0 && content[i] === "\\"; i--) {
    backslashCount++
  }

  return backslashCount % 2 === 1
}

export function stripJsonComments(content: string): string {
  let result = ""
  let inString = false
  let stringChar = ""
  let inSingleLineComment = false
  let inMultiLineComment = false

  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    const nextChar = content[i + 1]

    if (inSingleLineComment) {
      if (char === "\n") {
        inSingleLineComment = false
        result += char
      }
      continue
    }

    if (inMultiLineComment) {
      if (char === "*" && nextChar === "/") {
        inMultiLineComment = false
        i++
      }
      continue
    }

    if (!inString) {
      if (char === '"' || char === "'" || char === "`") {
        inString = true
        stringChar = char
        result += char
      } else if (char === "/" && nextChar === "/") {
        inSingleLineComment = true
        i++
      } else if (char === "/" && nextChar === "*") {
        inMultiLineComment = true
        i++
      } else {
        result += char
      }
    } else {
      if (char === stringChar && !isEscaped(content, i)) {
        inString = false
      }
      result += char
    }
  }

  return result
}
