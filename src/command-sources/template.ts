import type { SourceConfig } from "./types"
import { substituteVariables } from "./variable-substitution"

export const SHELL_TEMPLATE_PREFIX = "Use shell to execute"

export function buildShellTemplate(command: string): string {
  return `${SHELL_TEMPLATE_PREFIX} \`${command}\``
}

export function buildConfiguredTemplate(
  defaultTemplate: string,
  vars: Record<string, string>,
  config?: SourceConfig
): string {
  const baseTemplate = config?.prompt
    ? substituteVariables(config.prompt, vars)
    : defaultTemplate
  const append = config?.prompt_append
    ? substituteVariables(config.prompt_append, vars)
    : ""

  return baseTemplate + append
}

export function injectCommandArguments(template: string, argumentsText?: string): string {
  return template.replaceAll("$ARGUMENTS", argumentsText ?? "").trim()
}
