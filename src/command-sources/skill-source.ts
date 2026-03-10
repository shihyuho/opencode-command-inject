import type { CommandInfo, CommandSource, LoadContext, LoadedSkillCommandInput } from "./types"

export class SkillCommandSource implements CommandSource {
  readonly id = "skill"

  constructor(private readonly loadedSkills: LoadedSkillCommandInput[]) {}

  async load(ctx: LoadContext): Promise<CommandInfo[]> {
    const commands: CommandInfo[] = []
    const seenNames = new Set<string>()

    for (const skill of this.loadedSkills) {
      let name = skill.name.trim()

      if (!name) {
        ctx.logger.warn(`[command-sources] skipping skill with blank name`)
        continue
      }

      // Normalize: remove existing "skill:" prefix if present (with or without space)
      const prefix = "skill:"
      if (name.toLowerCase().startsWith(prefix)) {
        name = name.slice(prefix.length).trim()
      }

      // Skip if becomes blank after normalization
      if (!name) {
        ctx.logger.warn(`[command-sources] skipping skill with blank name after normalization`)
        continue
      }

      const normalizedName = `skill:${name}`

      // Skip duplicates, keep first occurrence
      if (seenNames.has(normalizedName)) {
        ctx.logger.warn(`[command-sources] duplicate skill command '${normalizedName}', skipping`)
        continue
      }
      seenNames.add(normalizedName)

      commands.push({
        name: normalizedName,
        description: skill.description ?? name,
        template: skill.template,
      })
    }

    return commands
  }
}
