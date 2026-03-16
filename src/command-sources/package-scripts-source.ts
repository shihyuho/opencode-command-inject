import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { isErrnoException } from "./errors"
import { buildShellTemplate } from "./template"
import { detectPackageManager } from "./package-manager"
import type { CommandInfo, CommandSource, LoadContext, SourceConfig } from "./types"

interface PackageJsonLike {
  scripts?: Record<string, unknown>
  packageManager?: string
}

function substituteVariables(
  template: string,
  vars: { name: string; description: string; command: string; arguments: string }
): string {
  return template
    .replace(/{name}/g, vars.name)
    .replace(/{description}/g, vars.description)
    .replace(/{command}/g, vars.command)
    .replace(/{arguments}/g, vars.arguments)
}

export class PackageScriptsCommandSource implements CommandSource {
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

    const runner = await detectPackageManager(ctx.rootDir, {
      packageManager: data.packageManager as string | undefined
    })

    return Object.keys(data.scripts).map((script) => {
      const command = `${runner} run ${script}`

      if (this.config?.prompt) {
        const customTemplate = substituteVariables(this.config.prompt, {
          name: script,
          description: script,
          command,
          arguments: "$ARGUMENTS",
        })
        const append = this.config.prompt_append ?? ""
        return {
          name: `${runner}:${script}`,
          description: script,
          template: customTemplate + append,
        }
      }

      return {
        name: `${runner}:${script}`,
        description: script,
        template: buildShellTemplate(`${runner} run ${script} -- $ARGUMENTS`)
      }
    })
  }
}
