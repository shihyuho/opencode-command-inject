import type { Plugin } from "@opencode-ai/plugin"
import { createCommandInjectHooks } from "./plugin/command-inject"
import type { LoadedSkillCommandInput } from "./command-sources"
import { discoverSkills } from "./skills/discovery"
import { loadPluginConfig } from "./config"

export interface CommandInjectPluginOptions {
  loadedSkills?: LoadedSkillCommandInput[]
  discoverSkills?: boolean
}

function normalizeSkillName(name: string): string {
  const trimmed = name.trim()
  if (trimmed.toLowerCase().startsWith("skill:")) {
    return trimmed.slice("skill:".length).trim()
  }
  return trimmed
}

function mergeSkillInputs(
  manualSkills: LoadedSkillCommandInput[],
  discoveredSkills: LoadedSkillCommandInput[],
  logger: { warn: (msg: string) => void }
): LoadedSkillCommandInput[] {
  const merged: LoadedSkillCommandInput[] = []
  const seen = new Set<string>()

  for (const skill of manualSkills) {
    const normalized = normalizeSkillName(skill.name)
    seen.add(normalized)
    merged.push(skill)
  }

  for (const skill of discoveredSkills) {
    const normalized = normalizeSkillName(skill.name)
    if (seen.has(normalized)) {
      logger.warn(
        `[command-inject] duplicate discovered skill '${normalized}', keeping manually provided version`
      )
      continue
    }
    seen.add(normalized)
    merged.push(skill)
  }

  return merged
}

export function createCommandInjectPlugin(options: CommandInjectPluginOptions = {}): Plugin {
  return async (ctx) => {
    const logger = { warn: (msg: string) => console.warn(msg) }

    // Load config first to check if skill source is disabled
    const config = await loadPluginConfig(ctx.directory)
    const skillDisabled = config.sources?.skill?.disable === true

    const hasManualSkills = (options.loadedSkills?.length ?? 0) > 0
    const shouldDiscover = options.discoverSkills ?? !hasManualSkills

    // Only discover skills if skill source is not disabled
    const discoveredSkills = shouldDiscover && !skillDisabled
      ? await discoverSkills({
          projectRoot: ctx.directory,
          logger,
        })
      : []

    const loadedSkills = mergeSkillInputs(
      options.loadedSkills ?? [],
      discoveredSkills.map((skill) => ({
        name: skill.name,
        description: skill.description,
        template: skill.template,
        body: skill.body,
      })),
      logger
    )

    return createCommandInjectHooks({
      projectRoot: ctx.directory,
      logger,
      existingCommands: [],
      loadedSkills,
      config,
    })
  }
}

export const CommandInjectPlugin: Plugin = createCommandInjectPlugin()
