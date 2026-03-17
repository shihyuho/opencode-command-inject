import type { CommandInfo, CommandSource, LoadContext, LoadedSkillCommandInput, SourceConfig } from "./types"
import { substituteVariables } from "./variable-substitution"

export class SkillCommandSource implements CommandSource {
  readonly id = "skill"

  constructor(private readonly loadedSkills: LoadedSkillCommandInput[], private readonly config?: SourceConfig) {}

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

      const description = skill.description ?? name
      const instruction = skill.body ?? skill.template
      const vars = {
        name,
        description,
        instruction,
        arguments: "$ARGUMENTS"
      }

      if (this.config?.prompt) {
        const customTemplate = substituteVariables(this.config.prompt, vars)
        const append = this.config.prompt_append
          ? substituteVariables(this.config.prompt_append, vars)
          : ""
        commands.push({
          name: normalizedName,
          description,
          template: customTemplate + append
        })
      } else {
        const append = this.config?.prompt_append
          ? substituteVariables(this.config.prompt_append, vars)
          : ""
        commands.push({
          name: normalizedName,
          description,
          template: skill.template + append
        })
      }
    }

    return commands
  }
}
