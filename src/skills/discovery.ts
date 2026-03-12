import { readdir } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"
import { loadSkill } from "./load-skill"
import type { DiscoveryOptions, LoadedSkillDefinition } from "./types"

function normalizeSkillName(name: string): string {
  const trimmed = name.trim()
  if (trimmed.toLowerCase().startsWith("skill:")) {
    return trimmed.slice("skill:".length).trim()
  }
  return trimmed
}

export function getSkillRoots(projectRoot: string, homeDirectory = homedir()): string[] {
  return [
    join(projectRoot, ".opencode", "skills"),
    join(homeDirectory, ".config", "opencode", "skills"),
    join(projectRoot, ".claude", "skills"),
    join(projectRoot, ".agents", "skills"),
    join(homeDirectory, ".claude", "skills"),
    join(homeDirectory, ".agents", "skills"),
  ]
}

export async function discoverSkills(options: DiscoveryOptions): Promise<LoadedSkillDefinition[]> {
  const roots = options.roots ?? getSkillRoots(options.projectRoot, options.homeDirectory)
  const discovered: LoadedSkillDefinition[] = []
  const seen = new Map<string, string>()

  for (const root of roots) {
    let entries
    try {
      entries = await readdir(root, { withFileTypes: true })
    } catch (error) {
      const err = error as NodeJS.ErrnoException
      if (err.code === "ENOENT") {
        continue
      }
      options.logger.warn(
        `[command-inject] failed to read skills directory '${root}': ${err.message}`
      )
      continue
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue
      }

      const skillDir = join(root, entry.name)
      let loaded: LoadedSkillDefinition | null
      try {
        loaded = await loadSkill(skillDir)
      } catch (error) {
        const err = error as NodeJS.ErrnoException
        options.logger.warn(
          `[command-inject] failed to load skill from '${skillDir}': ${err.message}`
        )
        continue
      }
      if (!loaded) {
        continue
      }

      const normalizedName = normalizeSkillName(loaded.name)
      const existingSource = seen.get(normalizedName)
      if (existingSource) {
        options.logger.debug?.(
          `[command-inject] duplicate discovered skill '${normalizedName}', keeping '${existingSource}' and skipping '${loaded.sourcePath}'`
        )
        continue
      }

      seen.set(normalizedName, loaded.sourcePath)
      discovered.push(loaded)
    }
  }

  return discovered
}
