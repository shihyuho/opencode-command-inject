import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { isErrnoException } from "./errors"
import type { CommandInfo, CommandSource, LoadContext } from "./types"

interface PackageJsonLike {
  scripts?: Record<string, unknown>
}

export class NpmScriptsCommandSource implements CommandSource {
  readonly id = "npm-scripts"

  async load(ctx: LoadContext): Promise<CommandInfo[]> {
    const packageJsonPath = join(ctx.rootDir, "package.json")

    let content: string
    try {
      content = await readFile(packageJsonPath, "utf8")
    } catch (error) {
      if (isErrnoException(error) && error.code === "ENOENT") {
        return []
      }
      ctx.logger.warn(`[command-sources] failed to read package.json: ${packageJsonPath}`)
      return []
    }

    let data: PackageJsonLike
    try {
      data = JSON.parse(content) as PackageJsonLike
    } catch {
      ctx.logger.warn(`[command-sources] failed to parse package.json: ${packageJsonPath}`)
      return []
    }

    if (!data.scripts || typeof data.scripts !== "object") {
      return []
    }

    return Object.keys(data.scripts).map((script) => ({
      name: `npm:${script}`,
      description: script,
      template: `npm run ${script} -- $ARGUMENTS`
    }))
  }
}

