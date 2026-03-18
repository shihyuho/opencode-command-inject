const skillPrefix = "skill:"

export function normalizeSkillName(name: string): string {
  const trimmed = name.trim()
  if (trimmed.toLowerCase().startsWith(skillPrefix)) {
    return trimmed.slice(skillPrefix.length).trim()
  }
  return trimmed
}

export function toSkillCommandName(name: string): string {
  return `${skillPrefix}${normalizeSkillName(name)}`
}
