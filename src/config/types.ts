export interface SourceConfig {
  disable?: boolean
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
