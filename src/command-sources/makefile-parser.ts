export interface MakefileTarget {
  target: string
  description: string
}

const targetPattern = /^([a-zA-Z0-9_-]+):.*?(?:##(.*))?$/

export function parseMakefile(content: string): MakefileTarget[] {
  const result: MakefileTarget[] = []

  for (const line of content.split(/\r?\n/u)) {
    const trimmed = line.trim()
    if (trimmed === "" || trimmed.startsWith("#") || trimmed.startsWith(".")) {
      continue
    }

    const match = targetPattern.exec(trimmed)
    if (!match) {
      continue
    }

    const target = match[1]
    const description = match[2]?.trim() || target
    result.push({ target, description })
  }

  return result
}
