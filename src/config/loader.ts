import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import { stripJsonComments } from "./strip-json-comments"
import { CommandInjectConfigSchema } from "./schema"
import type { CommandInjectConfig } from "./types"

const CONFIG_FILE_NAME = "opencode-command-inject"
const ENV_CONFIG_PATH = "OPENCODE_COMMAND_INJECT_CONFIG"

function getUserConfigDir(): string {
  return process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config")
}

function getEnvConfigPath(): string | null {
  return process.env[ENV_CONFIG_PATH] || null
}

interface LoadConfigResult {
  status: "loaded" | "missing" | "invalid"
  config?: CommandInjectConfig
}

function loadConfigFromPath(
  configPath: string,
  options: { warnOnMissing?: boolean } = {}
): LoadConfigResult {
  try {
    const content = fs.readFileSync(configPath, "utf-8")
    const rawConfig = JSON.parse(stripJsonComments(content))
    const result = CommandInjectConfigSchema.safeParse(rawConfig)
    if (!result.success) {
      console.warn(`[command-inject] Invalid config at ${configPath}:`)
      console.warn(result.error.format())
      return { status: "invalid" }
    }
    return { status: "loaded", config: result.data }
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as NodeJS.ErrnoException).code === "ENOENT") {
      if (options.warnOnMissing) {
        console.warn(`[command-inject] Config file specified by ${ENV_CONFIG_PATH} not found: ${configPath}`)
      }
      return { status: "missing" }
    }
    console.warn(`[command-inject] Error reading config from ${configPath}:`, (error as Error).message)
    return { status: "invalid" }
  }
}

function loadConfigAtBasePath(basePath: string): CommandInjectConfig | null {
  for (const candidatePath of [`${basePath}.jsonc`, `${basePath}.json`]) {
    const result = loadConfigFromPath(candidatePath)
    if (result.status === "loaded") {
      return result.config ?? null
    }
    if (result.status === "invalid") {
      return null
    }
  }

  return null
}

function deepMerge<T extends Record<string, unknown>>(base?: T, override?: T): T | undefined {
  if (!base) return override
  if (!override) return base
  const result = { ...base } as T
  for (const key of Object.keys(override) as (keyof T)[]) {
    const baseVal = base[key]
    const overrideVal = override[key]
    if (
      typeof baseVal === "object" && baseVal !== null &&
      typeof overrideVal === "object" && overrideVal !== null &&
      !Array.isArray(baseVal) && !Array.isArray(overrideVal)
    ) {
      result[key] = deepMerge(baseVal as Record<string, unknown>, overrideVal as Record<string, unknown>) as T[keyof T]
    } else {
      result[key] = overrideVal
    }
  }
  return result
}

export async function loadPluginConfig(directory: string): Promise<CommandInjectConfig> {
  const envConfigPath = getEnvConfigPath()
  if (envConfigPath) {
    const envConfig = loadConfigFromPath(envConfigPath, { warnOnMissing: true })
    if (envConfig.status === "loaded") {
      return envConfig.config ?? {}
    }
    if (envConfig.status === "invalid") {
      return {}
    }
  }

  const userConfigBasePath = path.join(getUserConfigDir(), "opencode", CONFIG_FILE_NAME)
  const projectConfigBasePath = path.join(directory, ".opencode", CONFIG_FILE_NAME)

  let config: CommandInjectConfig = loadConfigAtBasePath(userConfigBasePath) ?? {}

  const projectConfig = loadConfigAtBasePath(projectConfigBasePath)
  if (projectConfig) {
    config = {
      ...config,
      ...projectConfig,
      sources: deepMerge(config.sources, projectConfig.sources),
    }
  }

  return config
}
