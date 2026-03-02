export const SHELL_TEMPLATE_PREFIX = "Use shell to execute"

export function buildShellTemplate(command: string): string {
  return `${SHELL_TEMPLATE_PREFIX} \`${command}\``
}
