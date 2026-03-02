import type { Plugin } from "@opencode-ai/plugin"
import { createCommandsWireHooks } from "./plugin/commands-wire"

export const CommandsWirePlugin: Plugin = async (ctx) => {
    const logger = { warn: (msg: string) => console.warn(msg) }
    return createCommandsWireHooks({
        projectRoot: ctx.directory,
        logger,
        existingCommands: [],
    })
}
