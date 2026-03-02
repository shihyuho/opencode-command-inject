import type { Plugin } from "@opencode-ai/plugin"
import { createCommandInjectHooks } from "./plugin/command-inject"

export const CommandInjectPlugin: Plugin = async (ctx) => {
    const logger = { warn: (msg: string) => console.warn(msg) }
    return createCommandInjectHooks({
        projectRoot: ctx.directory,
        logger,
        existingCommands: [],
    })
}
