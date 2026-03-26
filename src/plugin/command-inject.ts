import type { Hooks } from "@opencode-ai/plugin"
import {
  SkillCommandSource,
  aggregateCommandSources,
  MakefileCommandSource,
  NpmScriptsCommandSource,
  type CommandInfo,
  type CommandSource,
  type Logger,
  type LoadedSkillCommandInput,
} from "../command-sources"
import type { CommandInjectConfig } from "../config"
import { injectCommandArguments } from "../command-sources/template"

export interface CommandInjectOptions {
  projectRoot: string
  logger: Logger
  existingCommands: CommandInfo[]
  loadedSkills?: LoadedSkillCommandInput[]
  config?: CommandInjectConfig
}

function resolveDynamicCommandCollisions(
  commands: readonly CommandInfo[],
  reservedNames: ReadonlySet<string>,
  logger: Logger,
  collisionTarget: "existing command" | "config command"
): CommandInfo[] {
  const groups = new Map<string, CommandInfo[]>()
  for (const command of commands) {
    const group = groups.get(command.name)
    if (group) {
      group.push(command)
      continue
    }
    groups.set(command.name, [command])
  }

  const resolved: CommandInfo[] = []
  const takenNames = new Set(reservedNames)
  const processedNames = new Set<string>()

  for (const command of commands) {
    if (processedNames.has(command.name)) {
      continue
    }
    processedNames.add(command.name)

    const group = groups.get(command.name) ?? [command]
    const collidesWithReserved = reservedNames.has(command.name)
    const hasCustomizedCommand = group.some((item) => item.usedCustomizedName === true)
    const fallbackNames = group.map((item) => item.canonicalName ?? item.name)
    const fallbackNamesAreUnique = new Set(fallbackNames).size === fallbackNames.length
    const fallbackNamesAvailable = fallbackNames.every((name) => !takenNames.has(name))

    if (collidesWithReserved && hasCustomizedCommand && fallbackNamesAreUnique && fallbackNamesAvailable) {
      const fallbackCommands = group.map((item, index) => ({
        ...item,
        name: fallbackNames[index]!,
      }))

      for (const fallbackCommand of fallbackCommands) {
        takenNames.add(fallbackCommand.name)
        resolved.push(fallbackCommand)
      }

      logger.warn(
        `[command-inject] customized command name collision on '${command.name}' with ${collisionTarget}; falling back to canonical names: ${fallbackCommands
          .map((fallbackCommand) => `${fallbackCommand.sourceId ?? "dynamic"} -> ${fallbackCommand.name}`)
          .join(", ")}`
      )
      continue
    }

    if (collidesWithReserved) {
      if (hasCustomizedCommand) {
        logger.warn(
          `[command-inject] customized command name collision on '${command.name}' with ${collisionTarget}; attempted canonical fallback but names still collide, keeping existing`
        )
      } else if (collisionTarget === "config command") {
        resolved.push(...group)
      } else {
        logger.warn(
          `[command-inject] duplicate command '${command.name}' from dynamic sources, keeping existing`
        )
      }
      continue
    }

    for (const item of group) {
      if (takenNames.has(item.name)) {
        logger.warn(`[command-inject] duplicate command '${item.name}' from dynamic sources, keeping existing`)
        continue
      }

      takenNames.add(item.name)
      resolved.push(item)
    }
  }

  return resolved
}

export async function createCommandInjectHooks(
  options: CommandInjectOptions
): Promise<Partial<Hooks>> {
  const injectedNames = new Set<string>()
  let catalog = new Map<string, CommandInfo>()
  const dynamicSources: CommandSource[] = []

  if (!options.config?.sources?.makefile?.disable) {
    dynamicSources.push(
      new MakefileCommandSource(
        options.config?.sources?.makefile,
        options.config?.command_name_prefix
      )
    )
  }

  if (!options.config?.sources?.["npm-scripts"]?.disable) {
    dynamicSources.push(
      new NpmScriptsCommandSource(
        options.config?.sources?.["npm-scripts"],
        options.config?.command_name_prefix
      )
    )
  }

  if (
    !options.config?.sources?.skill?.disable &&
    options.loadedSkills &&
    options.loadedSkills.length > 0
  ) {
    dynamicSources.push(
      new SkillCommandSource(
        options.loadedSkills,
        options.config?.sources?.skill,
        options.config?.command_name_prefix
      )
    )
  }

  const dynamicCommands = await aggregateCommandSources(dynamicSources, {
    rootDir: options.projectRoot,
    logger: options.logger,
  })

  const existingNames = new Set(options.existingCommands.map((cmd) => cmd.name))
  const existingResolvedDynamicCommands = resolveDynamicCommandCollisions(
    dynamicCommands,
    existingNames,
    options.logger,
    "existing command"
  )

  return {
    config: async (config) => {
      if (!config.command) {
        config.command = {}
      }

      injectedNames.clear()
      const configResolvedDynamicCommands = resolveDynamicCommandCollisions(
        existingResolvedDynamicCommands,
        new Set(Object.keys(config.command)),
        options.logger,
        "config command"
      )

      catalog = new Map(options.existingCommands.map((command) => [command.name, command]))
      for (const command of configResolvedDynamicCommands) {
        catalog.set(command.name, command)
      }

      for (const cmd of catalog.values()) {
        if (config.command[cmd.name]) {
          options.logger.warn(
            `[command-inject] command '${cmd.name}' already exists in config, skipping injection`
          )
          continue
        }
        injectedNames.add(cmd.name)
        config.command[cmd.name] = {
          template: cmd.template,
          description: cmd.description,
        }
      }
    },
    "command.execute.before": async (inp, output) => {
      if (!injectedNames.has(inp.command)) return
      const cmd = catalog.get(inp.command)
      if (!cmd) return
      const text = injectCommandArguments(cmd.template, inp.arguments)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      output.parts.unshift({ type: "text", text } as any)
    },
  }
}
