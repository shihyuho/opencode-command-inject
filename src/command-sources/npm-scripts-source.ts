import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { isErrnoException } from "./errors"
import { buildShellTemplate } from "./template"
import { detectNpmScriptsRunner } from "./npm-scripts-runner"
import { substituteVariables } from "./variable-substitution"
import type { CommandInfo, CommandSource, LoadContext, SourceConfig } from "./types"

interface PackageJsonLike {
  scripts?: Record<string, unknown>
  packageManager?: string
}

export class NpmScriptsCommandSource implements CommandSource {
  readonly id = "npm-scripts"

  constructor(private readonly config?: SourceConfig) {}

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

    const runner = await detectNpmScriptsRunner(ctx.rootDir, {
      packageManager: data.packageManager as string | undefined
    })

    return Object.keys(data.scripts).map((script) => {
      const command = `${runner} run ${script}`

      const vars = {
        name: script,
        description: script,
        command,
        arguments: "$ARGUMENTS"
      }

      // Use custom prompt or default
      if (this.config?.prompt) {
        const customTemplate = substituteVariables(this.config.prompt, vars)
        const append = this.config.prompt_append
          ? substituteVariables(this.config.prompt_append, vars)
          : ""
        return {
          name: `${runner}:${script}`,
          description: script,
          template: customTemplate + append,
        }
      }

      const baseTemplate = buildShellTemplate(`${command} -- $ARGUMENTS`)
      const append = this.config?.prompt_append
        ? substituteVariables(this.config.prompt_append, vars)
        : ""
      return {
        name: `${runner}:${script}`,
        description: script,
        template: baseTemplate + append,
      }
    })
  }
}
