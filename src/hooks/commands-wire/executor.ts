import {
  aggregateCommandSources,
  MakefileCommandSource,
  NpmScriptsCommandSource,
  type CommandInfo,
  type Logger
} from "../../features/command-sources"

export interface BuildCommandCatalogOptions {
  rootDir: string
  logger: Logger
  existingCommands?: CommandInfo[]
}

export async function buildCommandCatalog(options: BuildCommandCatalogOptions): Promise<CommandInfo[]> {
  const existingCommands = options.existingCommands ?? []
  const dynamicSources = [new MakefileCommandSource(), new NpmScriptsCommandSource()]

  const dynamicCommands = await aggregateCommandSources(dynamicSources, {
    rootDir: options.rootDir,
    logger: options.logger
  })

  const existingNames = new Set(existingCommands.map((cmd) => cmd.name))
  const merged = [...existingCommands]

  for (const command of dynamicCommands) {
    if (existingNames.has(command.name)) {
      options.logger.warn(
        `[commands-wire] duplicate command '${command.name}' from dynamic sources, keeping existing`
      )
      continue
    }

    existingNames.add(command.name)
    merged.push(command)
  }

  return merged
}
