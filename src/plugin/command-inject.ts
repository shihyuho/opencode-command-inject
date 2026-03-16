import type { Hooks } from "@opencode-ai/plugin"
import {
    SkillCommandSource,
    aggregateCommandSources,
    MakefileCommandSource,
    PackageScriptsCommandSource,
    type CommandInfo,
    type CommandSource,
    type Logger,
    type LoadedSkillCommandInput,
} from "../command-sources"
import type { CommandInjectConfig } from "../config"

export interface CommandInjectOptions {
    projectRoot: string
    logger: Logger
    existingCommands: CommandInfo[]
    loadedSkills?: LoadedSkillCommandInput[]
    config?: CommandInjectConfig
}

export async function createCommandInjectHooks(
    options: CommandInjectOptions
): Promise<Partial<Hooks>> {
    const injectedNames = new Set<string>()
    const dynamicSources: CommandSource[] = []

    if (options.config?.sources?.makefile?.enabled !== false) {
        dynamicSources.push(new MakefileCommandSource(options.config?.sources?.makefile))
    }

    if (options.config?.sources?.["npm-scripts"]?.enabled !== false) {
        dynamicSources.push(new PackageScriptsCommandSource(options.config?.sources?.["npm-scripts"]))
    }

    if (
        options.config?.sources?.skill?.enabled !== false &&
        options.loadedSkills &&
        options.loadedSkills.length > 0
    ) {
        dynamicSources.push(new SkillCommandSource(options.loadedSkills, options.config?.sources?.skill))
    }

    const dynamicCommands = await aggregateCommandSources(dynamicSources, {
        rootDir: options.projectRoot,
        logger: options.logger,
    })

    const existingNames = new Set(options.existingCommands.map((cmd) => cmd.name))
    const merged = [...options.existingCommands]
    for (const command of dynamicCommands) {
        if (existingNames.has(command.name)) {
            options.logger.warn(
                `[command-inject] duplicate command '${command.name}' from dynamic sources, keeping existing`
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
            const text = cmd.template.replace("$ARGUMENTS", inp.arguments ?? "").trim()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            output.parts.unshift({ type: "text", text } as any)
        },
    }
}
