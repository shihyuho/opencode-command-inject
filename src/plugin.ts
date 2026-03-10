import type { Plugin } from "@opencode-ai/plugin"
import { createCommandInjectHooks } from "./plugin/command-inject"
import type { LoadedSkillCommandInput } from "./command-sources"

export interface CommandInjectPluginOptions {
  loadedSkills?: LoadedSkillCommandInput[]
}

export function createCommandInjectPlugin(options: CommandInjectPluginOptions = {}): Plugin {
  return async (ctx) => {
    const logger = { warn: (msg: string) => console.warn(msg) }
    return createCommandInjectHooks({
      projectRoot: ctx.directory,
      logger,
      existingCommands: [],
      loadedSkills: options.loadedSkills ?? [],
    })
  }
}

export const CommandInjectPlugin: Plugin = createCommandInjectPlugin()
