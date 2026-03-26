export interface CommandNamePrefixConfig {
  disable?: boolean
  value?: string
}

export interface SourceConfig {
  disable?: boolean
  prompt?: string
  prompt_append?: string
  command_name_prefix?: CommandNamePrefixConfig
}

export interface CommandInjectConfig {
  command_name_prefix?: {
    disable?: boolean
  }
  sources?: {
    makefile?: SourceConfig
    "npm-scripts"?: SourceConfig
    skill?: SourceConfig
  }
}
