export interface ParsedFrontmatter {
  name: string | undefined
  description: string | undefined
  body: string
}

export interface LoadedSkillDefinition {
  name: string
  description: string
  template: string
  body?: string
  sourcePath: string
}

export interface DiscoveryLogger {
  warn(message: string): void
  debug?(message: string): void
}

export interface DiscoveryOptions {
  projectRoot: string
  homeDirectory?: string
  logger: DiscoveryLogger
  roots?: string[]
}
