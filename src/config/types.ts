export interface SourceConfig {
  enabled?: boolean
  prompt?: string
  prompt_append?: string
}

export interface CommandInjectConfig {
  sources?: {
    makefile?: SourceConfig
    "npm-scripts"?: SourceConfig
    skill?: SourceConfig
  }
}
