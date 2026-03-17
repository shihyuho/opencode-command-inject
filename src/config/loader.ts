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

function findConfigPath(basePath: string): string | null {
  const jsoncPath = `${basePath}.jsonc`
  const jsonPath = `${basePath}.json`

  if (fs.existsSync(jsoncPath)) return jsoncPath
  if (fs.existsSync(jsonPath)) return jsonPath
  return null
}

function getEnvConfigPath(): string | null {
  const envPath = process.env[ENV_CONFIG_PATH]
  if (!envPath) return null
  if (fs.existsSync(envPath)) return envPath
  console.warn(`[command-inject] Config file specified by ${ENV_CONFIG_PATH} not found: ${envPath}`)
  return null
}

function loadConfigFromPath(configPath: string): CommandInjectConfig | null {
  try {
    const content = fs.readFileSync(configPath, "utf-8")
    const rawConfig = JSON.parse(stripJsonComments(content))
    const result = CommandInjectConfigSchema.safeParse(rawConfig)
    if (!result.success) {
      console.warn(`[command-inject] Invalid config at ${configPath}:`)
      console.warn(result.error.format())
      return null
    }
    return result.data
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as NodeJS.ErrnoException).code === "ENOENT") {
      return null
    }
    console.warn(`[command-inject] Error reading config from ${configPath}:`, (error as Error).message)
    return null
  }
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
  // Check for environment variable first - explicit path takes precedence
  const envConfigPath = getEnvConfigPath()
  if (envConfigPath) {
    const envConfig = loadConfigFromPath(envConfigPath)
    return envConfig ?? {}
  }

  // Default: user config + project config with deep merge
  const userConfigBasePath = path.join(getUserConfigDir(), "opencode", CONFIG_FILE_NAME)
  const projectConfigBasePath = path.join(directory, ".opencode", CONFIG_FILE_NAME)

  const userConfigPath = findConfigPath(userConfigBasePath)
  const projectConfigPath = findConfigPath(projectConfigBasePath)

  let config: CommandInjectConfig = userConfigPath ? (loadConfigFromPath(userConfigPath) ?? {}) : {}

  const projectConfig = projectConfigPath ? loadConfigFromPath(projectConfigPath) : null
  if (projectConfig) {
    config = {
      ...config,
      ...projectConfig,
      sources: deepMerge(config.sources, projectConfig.sources),
    }
  }

  return config
}
