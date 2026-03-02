import type { Hooks } from "@opencode-ai/plugin"
import {
    aggregateCommandSources,
    MakefileCommandSource,
    NpmScriptsCommandSource,
    type CommandInfo,
    type Logger,
} from "../command-sources"

export interface CommandsWireOptions {
    projectRoot: string
    logger: Logger
    existingCommands: CommandInfo[]
}

export async function createCommandsWireHooks(
    options: CommandsWireOptions
): Promise<Partial<Hooks>> {
    const dynamicSources = [new MakefileCommandSource(), new NpmScriptsCommandSource()]
    const dynamicCommands = await aggregateCommandSources(dynamicSources, {
        rootDir: options.projectRoot,
        logger: options.logger,
    })

    const existingNames = new Set(options.existingCommands.map((cmd) => cmd.name))
    const merged = [...options.existingCommands]
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

    const catalog = new Map(merged.map((c) => [c.name, c]))
    return {
        config: async (config) => {
            if (!config.command) {
                config.command = {}
            }
            for (const cmd of catalog.values()) {
                if (!config.command[cmd.name]) {
                    config.command[cmd.name] = {
                        template: cmd.template,
                        description: cmd.description,
                    }
                }
            }
        },
        "command.execute.before": async (inp, output) => {
            const cmd = catalog.get(inp.command)
            if (!cmd) return
            const text = cmd.template.replace("$ARGUMENTS", inp.arguments ?? "").trim()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            output.parts.unshift({ type: "text", text } as any)
        },
    }
}
