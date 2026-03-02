import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { isErrnoException } from "./errors"
import { parseMakefile } from "./makefile-parser"
import type { CommandInfo, CommandSource, LoadContext } from "./types"

export class MakefileCommandSource implements CommandSource {
  readonly id = "makefile"

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
    return items.map(({ target, description }) => ({
      name: `make:${target}`,
      description,
      template: `make ${target} $ARGUMENTS`
    }))
  }
}

