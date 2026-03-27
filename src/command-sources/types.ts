export type { SourceConfig } from "../config/types"

export interface CommandInfo {
  name: string
  description: string
  template: string
  sourceId?: string
  canonicalName?: string
  usedCustomizedName?: boolean
}

export interface LoadedSkillCommandInput {
  name: string
  template: string
  body?: string
  description?: string
}

export interface Logger {
  warn(message: string): void
}

export interface LoadContext {
  rootDir: string
  logger: Logger
}

export interface CommandSource {
  id: string
  load(ctx: LoadContext): Promise<CommandInfo[]>
}
