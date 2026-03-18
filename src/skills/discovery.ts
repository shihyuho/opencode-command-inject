import { readdir, realpath, stat } from "node:fs/promises"
import { homedir } from "node:os"
import { join, relative, basename } from "node:path"
import { loadSkill } from "./load-skill"
import { normalizeSkillName } from "./normalize-skill-name"
import type { DiscoveryOptions, LoadedSkillDefinition } from "./types"
import { isErrnoException } from "../command-sources/errors"

const SKILL_PREFIX = "skill:"

function applyNamespace(
  skill: LoadedSkillDefinition,
  skillDir: string,
  rootDir: string
): LoadedSkillDefinition {
  // Get relative path from root to skill directory
  // e.g., skillDir = /path/to/skills/a/b, rootDir = /path/to/skills
  // relativePath = a/b
  const relativePath = relative(rootDir, skillDir)

  // Get the directory name (last part of the path)
  const dirName = basename(skillDir)

  // If skill name is the same as directory name, don't duplicate it
  // e.g., skills/a with name=a -> skill:a (not skill:a:a)
  const useShortName = skill.name.toLowerCase() === dirName.toLowerCase()

  if (!relativePath || relativePath === ".") {
    // Directly in root
    return {
      ...skill,
      name: useShortName ? `${SKILL_PREFIX}${dirName}` : `${SKILL_PREFIX}${skill.name}`,
    }
  }

  // Convert path separators to colon and prepend "skill:"
  // a/b -> skill:a:b
  const namespacePrefix = SKILL_PREFIX + relativePath.replace(/[/\\]/g, ":")

  return {
    ...skill,
    name: useShortName ? namespacePrefix : `${namespacePrefix}:${skill.name}`,
  }
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

async function scanDirectory(
  dir: string,
  root: string,
  discovered: LoadedSkillDefinition[],
  seen: Map<string, string>,
  visitedPaths: Set<string>,
  logger: DiscoveryOptions["logger"]
): Promise<void> {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch (error) {
    if (isErrnoException(error) && error.code === "ENOENT") {
      return
    }
    logger.warn(`[command-inject] failed to read skills directory '${dir}': ${(error as Error).message}`)
    return
  }

  let resolvedPath: string
  try {
    resolvedPath = await realpath(dir)
  } catch {
    return
  }

  if (visitedPaths.has(resolvedPath)) {
    return
  }
  visitedPaths.add(resolvedPath)

  for (const entry of entries) {
    const entryPath = join(dir, entry.name)

    // Skip non-directories (but follow symlinks that point to directories)
    if (!entry.isDirectory()) {
      // Check if it's a symlink pointing to a directory
      if (entry.isSymbolicLink()) {
        try {
          const stats = await stat(entryPath)
          if (!stats.isDirectory()) {
            continue
          }
        } catch {
          continue
        }
      } else {
        continue
      }
    }

    // First, check if this directory contains a SKILL.md (leaf skill)
    let loaded: LoadedSkillDefinition | null
    try {
      loaded = await loadSkill(entryPath)
    } catch (error) {
      logger.warn(`[command-inject] failed to load skill from '${entryPath}': ${(error as Error).message}`)
      continue
    }

    if (loaded) {
      const namespaced = applyNamespace(loaded, entryPath, root)
      const normalizedName = normalizeSkillName(namespaced.name)
      const existingSource = seen.get(normalizedName)
      if (existingSource) {
        logger.debug?.(
          `[command-inject] duplicate discovered skill '${normalizedName}', keeping '${existingSource}' and skipping '${namespaced.sourcePath}'`
        )
      } else {
        seen.set(normalizedName, namespaced.sourcePath)
        discovered.push(namespaced)
      }
    }

    // Then, recurse into subdirectories (for nested skills)
    await scanDirectory(entryPath, root, discovered, seen, visitedPaths, logger)
  }
}

export async function discoverSkills(options: DiscoveryOptions): Promise<LoadedSkillDefinition[]> {
  const roots = options.roots ?? getSkillRoots(options.projectRoot, options.homeDirectory)
  const discovered: LoadedSkillDefinition[] = []
  const seen = new Map<string, string>()
  const visitedPaths = new Set<string>()

  for (const root of roots) {
    await scanDirectory(root, root, discovered, seen, visitedPaths, options.logger)
  }

  return discovered
}
