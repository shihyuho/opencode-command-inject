import type { ParsedFrontmatter } from "./types"

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/

export function parseFrontmatter(content: string): ParsedFrontmatter {
  const match = content.match(FRONTMATTER_REGEX)

  if (!match) {
    return {
      name: undefined,
      description: undefined,
      body: content,
    }
  }

  const [, frontmatterYaml, body] = match
  const frontmatter = extractSupportedFields(frontmatterYaml)

  return {
    name: frontmatter.name as string | undefined,
    description: frontmatter.description as string | undefined,
    body: body.trim(),
  }
}

function extractSupportedFields(yaml: string): Record<string, string> {
  const result: Record<string, string> = {}
  const lines = yaml.split("\n")

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const trimmedLine = line.trim()
    if (!trimmedLine || trimmedLine.startsWith("#")) continue

    const colonIndex = line.indexOf(":")
    if (colonIndex === -1) continue

    const key = line.slice(0, colonIndex).trim()
    if (key !== "name" && key !== "description") continue

    const rawValue = line.slice(colonIndex + 1).trim()
    if (rawValue === "|" || rawValue === "|-" || rawValue === "|+") {
      const blockLines: string[] = []
      for (let nextIndex = index + 1; nextIndex < lines.length; nextIndex += 1) {
        const nextLine = lines[nextIndex]
        if (!nextLine.startsWith("  ") && nextLine.trim() !== "") {
          break
        }
        blockLines.push(nextLine.startsWith("  ") ? nextLine.slice(2) : "")
        index = nextIndex
      }
      result[key] = blockLines.join("\n").trimEnd()
      continue
    }

    if (rawValue === ">" || rawValue === ">-" || rawValue === ">+") {
      const blockLines: string[] = []
      for (let nextIndex = index + 1; nextIndex < lines.length; nextIndex += 1) {
        const nextLine = lines[nextIndex]
        if (!nextLine.startsWith("  ") && nextLine.trim() !== "") {
          break
        }
        blockLines.push(nextLine.startsWith("  ") ? nextLine.slice(2) : "")
        index = nextIndex
      }
      result[key] = foldBlockLines(blockLines)
      continue
    }

    const value = normalizeScalar(rawValue)

    result[key] = value
  }

  return result
}

function foldBlockLines(lines: string[]): string {
  const folded: string[] = []

  for (const line of lines) {
    if (!folded.length) {
      folded.push(line)
      continue
    }

    if (line === "" || folded[folded.length - 1] === "") {
      folded.push(line)
      continue
    }

    folded[folded.length - 1] = `${folded[folded.length - 1]} ${line}`
  }

  return folded.join("\n").trimEnd()
}

function normalizeScalar(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  return value
}
