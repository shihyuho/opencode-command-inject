import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { isErrnoException } from "./errors"
import { parseMakefile } from "./makefile-parser"
import { buildShellTemplate } from "./template"
import { substituteVariables } from "./variable-substitution"
import type { CommandInfo, CommandSource, LoadContext, SourceConfig } from "./types"

export class MakefileCommandSource implements CommandSource {
  readonly id = "makefile"

  constructor(private readonly config?: SourceConfig) {}

  async load(ctx: LoadContext): Promise<CommandInfo[]> {
    const makefilePath = join(ctx.rootDir, "Makefile")

    let content: string
    try {
      content = await readFile(makefilePath, "utf8")
    } catch (error) {
      if (isErrnoException(error) && error.code === "ENOENT") {
        return []
      }
      ctx.logger.warn(`[command-sources] failed to read Makefile: ${makefilePath}`)
      return []
    }

    const items = parseMakefile(content)
    return items.map(({ target, description }) => {
      const command = `make ${target}`
      const baseTemplate = buildShellTemplate(`${command} $ARGUMENTS`)

      const vars = {
        name: target,
        description,
        command,
        arguments: "$ARGUMENTS"
      }

      if (this.config?.prompt) {
        const customTemplate = substituteVariables(this.config.prompt, vars)
        const append = this.config.prompt_append
          ? substituteVariables(this.config.prompt_append, vars)
          : ""
        return {
          name: `make:${target}`,
          description,
          template: customTemplate + append
        }
      }

      const append = this.config?.prompt_append
        ? substituteVariables(this.config.prompt_append, vars)
        : ""
      return {
        name: `make:${target}`,
        description,
        template: baseTemplate + append
      }
    })
  }
}
