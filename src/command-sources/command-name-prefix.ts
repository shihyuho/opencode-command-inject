import type { CommandInjectConfig, SourceConfig } from "../config/types"

export interface BuildCommandNameOptions {
  name: string
  canonicalPrefix: string
  globalCommandNamePrefix?: CommandInjectConfig["command_name_prefix"]
  sourceConfig?: SourceConfig
}

export function buildCommandName({
  name,
  canonicalPrefix,
  globalCommandNamePrefix,
  sourceConfig,
}: BuildCommandNameOptions): string {
  const sourceCommandNamePrefix = sourceConfig?.command_name_prefix

  if (sourceCommandNamePrefix?.disable === true) {
    return name
  }

  if (sourceCommandNamePrefix?.disable === false) {
    return `${sourceCommandNamePrefix.value ?? canonicalPrefix}:${name}`
  }

  if (globalCommandNamePrefix?.disable === true) {
    return name
  }

  if (sourceCommandNamePrefix?.value) {
    return `${sourceCommandNamePrefix.value}:${name}`
  }

  return `${canonicalPrefix}:${name}`
}
