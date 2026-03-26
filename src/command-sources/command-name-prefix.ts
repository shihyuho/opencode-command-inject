import type { CommandInjectConfig, SourceConfig } from "../config/types"

export interface BuiltCommandName {
  configuredName: string
  canonicalName: string
  usedCustomizedName: boolean
}

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
}: BuildCommandNameOptions): BuiltCommandName {
  const sourceCommandNamePrefix = sourceConfig?.command_name_prefix
  const canonicalName = `${canonicalPrefix}:${name}`

  let usedCustomizedName = false

  const configuredName = (() => {
    if (sourceCommandNamePrefix?.disable === true) {
      usedCustomizedName = true
      return name
    }

    if (sourceCommandNamePrefix?.disable === false) {
      usedCustomizedName = sourceCommandNamePrefix.value !== undefined || canonicalPrefix !== ""
      return `${sourceCommandNamePrefix.value ?? canonicalPrefix}:${name}`
    }

    if (globalCommandNamePrefix?.disable === true) {
      usedCustomizedName = sourceCommandNamePrefix?.value === undefined
      return name
    }

    if (sourceCommandNamePrefix?.value) {
      usedCustomizedName = true
      return `${sourceCommandNamePrefix.value}:${name}`
    }

    return canonicalName
  })()

  return {
    configuredName,
    canonicalName,
    usedCustomizedName,
  }
}
