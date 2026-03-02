import type { CommandInfo, Logger } from "./features/command-sources"
import { createCommandsWireCatalog } from "./plugin/hooks/create-commands-wire-hooks"

export interface CreateHooksOptions {
  projectRoot: string
  logger: Logger
  existingCommands?: CommandInfo[]
}

export async function createHooks(options: CreateHooksOptions): Promise<{ commands: CommandInfo[] }> {
  const commands = await createCommandsWireCatalog({
    projectRoot: options.projectRoot,
    logger: options.logger,
    existingCommands: options.existingCommands ?? []
  })

  return { commands }
}
