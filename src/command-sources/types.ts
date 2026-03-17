export interface CommandInfo {
  name: string
  description: string
  template: string
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

export interface SourceConfig {
  enabled?: boolean
  prompt?: string
  prompt_append?: string
}
