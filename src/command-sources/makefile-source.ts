import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { isErrnoException } from "./errors"
import { parseMakefile } from "./makefile-parser"
import { buildConfiguredTemplate, buildShellTemplate } from "./template"
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
        arguments: "$ARGUMENTS",
      }

      return {
        name: `make:${target}`,
        description,
        template: buildConfiguredTemplate(baseTemplate, vars, this.config),
      }
    })
  }
}
