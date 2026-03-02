import { readFile, stat } from "node:fs/promises"
import { join } from "node:path"
import { isErrnoException } from "./errors"

export type PackageRunner = "npm" | "pnpm" | "yarn" | "bun"

interface PackageJsonData {
  packageManager?: string
}

export async function detectPackageRunner(
  rootDir: string,
  packageJsonData?: PackageJsonData
): Promise<PackageRunner> {
  // 1. Check packageManager in package.json (use provided data or read)
  if (packageJsonData?.packageManager && typeof packageJsonData.packageManager === "string") {
    const pm = packageJsonData.packageManager.split("@")[0]
    if (["npm", "pnpm", "yarn", "bun"].includes(pm)) {
      return pm as PackageRunner
    }
  } else {
    const packageJsonPath = join(rootDir, "package.json")
    try {
      const content = await readFile(packageJsonPath, "utf8")
      const data = JSON.parse(content) as PackageJsonData
      if (data?.packageManager && typeof data.packageManager === "string") {
        const pm = data.packageManager.split("@")[0]
        if (["npm", "pnpm", "yarn", "bun"].includes(pm)) {
          return pm as PackageRunner
        }
      }
    } catch (error) {
      if (!isErrnoException(error) || error.code !== "ENOENT") {
        // Ignore ENOENT, package.json missing
      }
    }
  }

  // 2. Check lockfiles in parallel
  const lockfiles: Record<string, PackageRunner> = {
    "pnpm-lock.yaml": "pnpm",
    "yarn.lock": "yarn",
    "bun.lockb": "bun",
    "bun.lock": "bun",
    "package-lock.json": "npm",
  }

  const lockfileEntries = Object.entries(lockfiles)
  const statPromises = lockfileEntries.map(async ([lockfile, runner]) => {
    try {
      await stat(join(rootDir, lockfile))
      return runner
    } catch (error) {
      if (isErrnoException(error) && error.code === "ENOENT") {
        return null
      }
      return null
    }
  })

  const results = await Promise.all(statPromises)
  for (let i = 0; i < results.length; i++) {
    if (results[i] !== null) {
      return results[i]!
    }
  }

  // 3. Fallback to npm
  return "npm"
}
