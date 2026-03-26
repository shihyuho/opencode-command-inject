import type { CommandInjectConfig } from "../config/types"
import type { CommandInfo, CommandSource, LoadContext, LoadedSkillCommandInput, SourceConfig } from "./types"
import { buildCommandName } from "./command-name-prefix"
import { buildConfiguredTemplate } from "./template"
import { normalizeSkillName, toSkillCommandName } from "../skills/normalize-skill-name"

export class SkillCommandSource implements CommandSource {
  readonly id = "skill"

  constructor(
    private readonly loadedSkills: LoadedSkillCommandInput[],
    private readonly config?: SourceConfig,
    private readonly globalCommandNamePrefix?: CommandInjectConfig["command_name_prefix"]
  ) {}

  async load(ctx: LoadContext): Promise<CommandInfo[]> {
    const commands: CommandInfo[] = []
    const seenNames = new Set<string>()

    for (const skill of this.loadedSkills) {
      const rawName = skill.name.trim()
      if (!rawName) {
        ctx.logger.warn(`[command-sources] skipping skill with blank name`)
        continue
      }

      let name = normalizeSkillName(rawName)
      if (!name) {
        ctx.logger.warn(`[command-sources] skipping skill with blank name after normalization`)
        continue
      }

      const normalizedName = toSkillCommandName(name)
      const commandName = buildCommandName({
        name,
        canonicalPrefix: "skill",
        globalCommandNamePrefix: this.globalCommandNamePrefix,
        sourceConfig: this.config,
      })

      // Skip duplicates, keep first occurrence
      if (seenNames.has(commandName)) {
        ctx.logger.warn(`[command-sources] duplicate skill command '${commandName}', skipping`)
        continue
      }
      seenNames.add(commandName)

      const description = skill.description ?? name
      const instruction = skill.body ?? skill.template
      const vars = {
        name,
        description,
        instruction,
        arguments: "$ARGUMENTS",
      }

      commands.push({
        name: commandName,
        description,
        template: buildConfiguredTemplate(skill.template, vars, this.config),
      })
    }

    return commands
  }
}
