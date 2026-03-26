import type { CommandInfo, CommandSource, LoadContext } from "./types"

interface LoadedCommand {
  command: CommandInfo
  sourceId: string
  order: number
}

interface MergedCommand {
  command: CommandInfo
  order: number
}

export async function aggregateCommandSources(
  sources: readonly CommandSource[],
  context: LoadContext
): Promise<CommandInfo[]> {
  const results = await Promise.all(sources.map((source) => source.load(context)))

  const merged: MergedCommand[] = []
  const seen = new Set<string>()
  const loaded: LoadedCommand[] = []

  for (let i = 0; i < sources.length; i++) {
    for (const command of results[i]) {
      loaded.push({
        command: {
          ...command,
          sourceId: command.sourceId ?? sources[i].id,
        },
        sourceId: command.sourceId ?? sources[i].id,
        order: loaded.length,
      })
    }
  }

  const groups = new Map<string, LoadedCommand[]>()
  for (const entry of loaded) {
    const group = groups.get(entry.command.name)
    if (group) {
      group.push(entry)
      continue
    }
    groups.set(entry.command.name, [entry])
  }

  const orderedGroups = [...groups.values()].sort((left, right) => left[0]!.order - right[0]!.order)

  for (const group of orderedGroups) {
    if (group.length === 1) {
      const only = group[0]!.command
      seen.add(only.name)
      merged.push({ command: only, order: group[0]!.order })
      continue
    }

    const collidedName = group[0]!.command.name
    const canonicalNames = group.map((entry) => entry.command.canonicalName ?? entry.command.name)
    const hasCustomizedCommand = group.some((entry) => entry.command.usedCustomizedName === true)
    const canonicalNamesAreUnique = new Set(canonicalNames).size === canonicalNames.length
    const fallbackNamesAvailable = canonicalNames.every((name) => !seen.has(name))

    if (hasCustomizedCommand && canonicalNamesAreUnique && fallbackNamesAvailable) {
      const fallbackCommands = group.map((entry, index) => ({
        command: {
          ...entry.command,
          name: canonicalNames[index]!,
        },
        order: entry.order,
      }))

      for (const entry of fallbackCommands) {
        seen.add(entry.command.name)
        merged.push(entry)
      }

      context.logger.warn(
        `[command-sources] customized command name collision on '${collidedName}' across ${group
          .map((entry) => entry.sourceId)
          .join(", ")}; falling back to canonical names: ${fallbackCommands
          .map((entry) => `${entry.command.sourceId} -> ${entry.command.name}`)
          .join(", ")}`
      )
      continue
    }

    if (hasCustomizedCommand) {
      context.logger.warn(
        `[command-sources] customized command name collision on '${collidedName}' across ${group
          .map((entry) => entry.sourceId)
          .join(", ")}; attempted canonical fallback but names still collide, keeping first`
      )
    }

    for (let i = 0; i < group.length; i++) {
      const command = group[i]!.command
      if (seen.has(command.name)) {
        context.logger.warn(
          `[command-sources] duplicate command '${command.name}' from source '${group[i]!.sourceId}', keeping first`
        )
        continue
      }

      seen.add(command.name)
      merged.push({ command, order: group[i]!.order })
    }
  }

  return merged.sort((left, right) => left.order - right.order).map((entry) => entry.command)
}
