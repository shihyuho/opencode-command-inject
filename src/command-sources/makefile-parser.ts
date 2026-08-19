export interface MakefileTarget {
  target: string
  description: string
}

const targetPattern = /^([a-zA-Z0-9_-]+):.*?(?:##(.*))?$/

export function parseMakefile(content: string): MakefileTarget[] {
  const targets = new Map<string, string | undefined>()

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
    const description = match[2]?.trim() || undefined

    if (targets.has(target)) {
      if (targets.get(target) === undefined && description !== undefined) {
        targets.set(target, description)
      }
      continue
    }

    targets.set(target, description)
  }

  return Array.from(targets, ([target, description]) => ({
    target,
    description: description ?? target,
  }))
}
