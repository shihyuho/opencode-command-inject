import { readFile } from "node:fs/promises"
import { join, basename } from "node:path"
import type { LoadedSkillDefinition } from "./types"
import { parseFrontmatter } from "./frontmatter"

function buildSkillTemplate(body: string): string {
  return `<skill-instruction>
${body}
</skill-instruction>

<user-request>
$ARGUMENTS
</user-request>`
}

export async function loadSkill(
  skillDir: string
): Promise<LoadedSkillDefinition | null> {
  const skillPath = join(skillDir, "SKILL.md")

  let content: string
  try {
    content = await readFile(skillPath, "utf8")
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return null
    }
    throw err
  }

  const parsed = parseFrontmatter(content)

  const dirName = basename(skillDir)

  if (!parsed.body || parsed.body.trim() === "") {
    return null
  }

  const name = parsed.name ?? dirName
  const description = parsed.description ?? name

  const template = buildSkillTemplate(parsed.body)

  return {
    name,
    description,
    template,
    body: parsed.body,
    sourcePath: skillPath,
  }
}
