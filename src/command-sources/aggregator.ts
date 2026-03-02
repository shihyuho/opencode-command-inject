import type { CommandInfo, CommandSource, LoadContext } from "./types"

export async function aggregateCommandSources(
  sources: readonly CommandSource[],
  context: LoadContext
): Promise<CommandInfo[]> {
  const results = await Promise.all(sources.map((source) => source.load(context)))

  const merged: CommandInfo[] = []
  const seen = new Set<string>()

  for (let i = 0; i < sources.length; i++) {
    for (const command of results[i]) {
      if (seen.has(command.name)) {
        context.logger.warn(
          `[command-sources] duplicate command '${command.name}' from source '${sources[i].id}', keeping first`
        )
        continue
      }

      seen.add(command.name)
      merged.push(command)
    }
  }

  return merged
}
