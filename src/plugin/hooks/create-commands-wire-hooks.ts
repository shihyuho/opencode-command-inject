import type { CommandInfo, Logger } from "../../features/command-sources"
import { buildCommandCatalog } from "../../hooks/commands-wire/executor"

export interface CommandsWireHookInput {
  projectRoot: string
  logger: Logger
  existingCommands: CommandInfo[]
}

export async function createCommandsWireCatalog(input: CommandsWireHookInput): Promise<CommandInfo[]> {
  return buildCommandCatalog({
    rootDir: input.projectRoot,
    logger: input.logger,
    existingCommands: input.existingCommands
  })
}
