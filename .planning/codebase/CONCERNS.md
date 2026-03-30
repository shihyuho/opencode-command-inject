# Codebase Concerns

**Analysis Date:** 2026-03-30

## Tech Debt

**Collision and precedence rules are spread across multiple layers:**
- Issue: Command naming, canonical fallback, and precedence are implemented in `src/command-sources/command-name-prefix.ts`, `src/command-sources/aggregator.ts`, `src/plugin/command-inject.ts`, and `src/plugin.ts`. The behavior depends on a specific chain: source-level naming → source aggregation → plugin-level reserved-name filtering → config injection.
- Files: `src/command-sources/command-name-prefix.ts`, `src/command-sources/aggregator.ts`, `src/plugin/command-inject.ts`, `src/plugin.ts`, `src/plugin/command-inject.test.ts`, `src/plugin.test.ts`
- Impact: Small changes to prefix config, duplicate handling, or source ordering can regress command visibility without obvious type errors. This is the highest regression-risk area in the repo.
- Fix approach: Treat precedence as a contract. Change only with matching updates to plugin-level and source-level tests, and preserve the current guarantees from `AGENTS.md`: manual skills win over discovered skills, existing/config commands win over injected commands, and collisions warn instead of overwriting.

**Hand-rolled file parsers carry format limitations:**
- Issue: The repo parses Makefiles, JSONC, and skill frontmatter with custom string logic instead of dedicated parsers.
- Files: `src/command-sources/makefile-parser.ts`, `src/config/strip-json-comments.ts`, `src/skills/frontmatter.ts`, `src/skills/load-skill.ts`
- Impact: Real-world syntax that falls outside the narrow supported subset can silently drop commands or metadata. Examples: complex Makefile targets, unusual JSONC edge cases, or frontmatter beyond `name` and `description`.
- Fix approach: Keep parser changes narrowly scoped, expand tests before broadening syntax support, and prefer compatibility-preserving improvements over parser rewrites unless there is a migration plan.

**Schema/type/artifact coupling requires manual discipline:**
- Issue: Config contract changes span runtime types, zod schema, generated schema artifact, docs, and release payload contents.
- Files: `src/config/types.ts`, `src/config/schema.ts`, `scripts/generate-schema.ts`, `opencode-command-inject.schema.json`, `package.json`, `.github/workflows/test.yml`, `docs/configuration.md`
- Impact: A config change can compile locally while shipping stale schema/docs to consumers if `bun run generate-schema` is skipped outside the tested path.
- Fix approach: Whenever `src/config/types.ts` or `src/config/schema.ts` changes, regenerate `opencode-command-inject.schema.json`, run tests, and verify docs/examples still match the runtime contract.

## Known Bugs

**Repository contains a tracked macOS artifact inside published source:**
- Symptoms: `src/.DS_Store` is present inside the source tree.
- Files: `src/.DS_Store`, `package.json`
- Trigger: Packaging from the current repo state includes the `src` directory because `package.json` publishes `src` broadly.
- Workaround: Remove `src/.DS_Store` and keep macOS artifacts excluded before release.

## Security Considerations

**Plugin intentionally turns repository files into executable shell commands:**
- Risk: `Makefile`, `package.json` scripts, and discovered `SKILL.md` files can cause shell commands or prompt text to appear in OpenCode. In an untrusted repo, this is effectively a command-suggestion injection surface.
- Files: `src/command-sources/makefile-source.ts`, `src/command-sources/npm-scripts-source.ts`, `src/skills/load-skill.ts`, `src/command-sources/template.ts`, `src/plugin/command-inject.ts`, `README.md`
- Current mitigation: The plugin only injects commands from configured/discovered local sources and keeps collisions non-destructive via warnings.
- Recommendations: Treat this plugin as trusted-repo-only by default, disable unnecessary sources through config in risky environments, and be careful when expanding prompt templating or discovery roots.

**Template interpolation is string-based, not shell-escaped:**
- Risk: `$ARGUMENTS` and `{...}` substitutions are inserted verbatim into templates.
- Files: `src/command-sources/template.ts`, `src/command-sources/variable-substitution.ts`, `src/plugin/command-inject.ts`
- Current mitigation: Current behavior is simple and predictable; templates are sourced from local project files/config.
- Recommendations: Preserve current semantics unless an explicit escaping policy is designed end-to-end. Ad hoc escaping changes here can break existing command behavior.

## Performance Bottlenecks

**Skill discovery is recursive and mostly sequential:**
- Problem: Startup discovery walks up to six roots and recursively scans every subdirectory, with per-entry `loadSkill` checks and symlink handling.
- Files: `src/skills/discovery.ts`, `src/skills/load-skill.ts`
- Cause: The implementation favors correctness and priority order over aggressive pruning or caching.
- Improvement path: If startup latency becomes visible, add bounded benchmarking first, then optimize directory filtering/caching without changing root priority or duplicate-resolution semantics.

## Fragile Areas

**Dynamic command collision handling:**
- Files: `src/plugin/command-inject.ts`, `src/command-sources/aggregator.ts`, `src/command-sources/command-name-prefix.ts`
- Why fragile: The same command can collide at three different points: within a source, across dynamic sources, and against existing/config commands. The fallback path depends on `canonicalName`, `usedCustomizedName`, and source order.
- Safe modification: Keep the warning prefixes `[command-inject]` and `[command-sources]`, preserve first-wins/manual-wins semantics, and update `src/plugin/command-inject.test.ts` plus `src/command-sources/aggregator.test.ts` in the same change.
- Test coverage: Strong unit coverage exists, but behavior is still brittle because small ordering changes alter user-visible command names.

**Skill naming and namespace derivation:**
- Files: `src/skills/discovery.ts`, `src/skills/normalize-skill-name.ts`, `src/command-sources/skill-source.ts`, `src/skills/discovery.test.ts`
- Why fragile: Names are derived from directory layout, frontmatter, root priority, and normalization rules. Symlink handling and nested namespaces are part of the contract.
- Safe modification: Do not change root order from `getSkillRoots()` or the `skill:` normalization rules unless you also re-verify duplicate priority behavior and nested namespace expectations.
- Test coverage: Good coverage for priority, nesting, and symlinks; low coverage for malformed filesystem states and non-ENOENT read failures.

**Config loading fallback behavior:**
- Files: `src/config/loader.ts`, `src/config/schema.ts`, `src/config/loader.test.ts`
- Why fragile: The loader treats missing/invalid config as recoverable and merges user/project config with special-case env-var precedence.
- Safe modification: Preserve the current fallback contract: env override first, then user config, then project merge, and warn instead of crashing on bad files.
- Test coverage: Good coverage for normal precedence paths; thin coverage for permission errors, partial filesystem failure, and malformed-but-readable edge cases.

## Scaling Limits

**Command catalog growth is linear and in-memory:**
- Current capacity: Suitable for small to medium command sets from a single repo plus local skill directories.
- Limit: Startup work scales with the number of discovered skills and generated commands because discovery, grouping, and collision resolution all build full in-memory lists/maps.
- Scaling path: If repos begin injecting very large command catalogs, add measurement around `discoverSkills()` and `aggregateCommandSources()` before changing algorithms.

## Dependencies at Risk

**`@opencode-ai/plugin` runtime contract changes can break integration quickly:**
- Risk: This package is a plugin adapter and depends on host hook shapes staying compatible.
- Impact: Breakage would surface at runtime in `src/plugin.ts` and `src/plugin/command-inject.ts`, even if local unit tests still pass with mocks.
- Migration plan: Add a lightweight host-level smoke test when upgrading `@opencode-ai/plugin`, and re-verify hook registration plus `command.execute.before` behavior.

## Missing Critical Features

**No end-to-end smoke test against a real OpenCode host session:**
- Problem: Current tests validate source adapters and hook composition in isolation, but not an installed plugin running inside the actual host.
- Blocks: Safe refactors around hook timing, injected config shape, and execution interception in `src/plugin.ts` and `src/plugin/command-inject.ts`.

**Release publish workflow can bypass the full verification gate:**
- Problem: `.github/workflows/release-npm.yml` runs `typecheck` before `npm publish`, but it does not rerun lint, tests, or schema verification in that workflow.
- Blocks: Confident manual `workflow_dispatch` publishing when `main` state is unclear or branch protection assumptions change.

## Test Coverage Gaps

**Parser edge cases remain under-specified:**
- What's not tested: More complex real-world Makefile syntax, broader JSONC corner cases, and frontmatter features outside the currently supported subset.
- Files: `src/command-sources/makefile-parser.ts`, `src/config/strip-json-comments.ts`, `src/skills/frontmatter.ts`, `src/command-sources/makefile-parser.test.ts`, `src/skills/frontmatter.test.ts`
- Risk: Expanding parser support or fixing one edge case can silently break another input class.
- Priority: High

**Filesystem and permission failure paths are only partially covered:**
- What's not tested: Permission-denied reads, transient `readdir`/`realpath` failures, and non-ENOENT errors while scanning or loading skills.
- Files: `src/skills/discovery.ts`, `src/skills/load-skill.ts`, `src/config/loader.ts`, `src/command-sources/makefile-source.ts`, `src/command-sources/npm-scripts-source.ts`
- Risk: The repo intentionally treats these failures as recoverable, so silent regressions can degrade command discovery without failing the build.
- Priority: Medium

**Publish/package surface is not smoke-tested:**
- What's not tested: The final npm package contents and top-level consumer entrypoint behavior after publish-oriented changes.
- Files: `index.ts`, `package.json`, `opencode-command-inject.schema.json`, `.github/workflows/release-npm.yml`
- Risk: Release artifacts can drift from repository expectations, especially when source inclusions or generated files change.
- Priority: Medium

---

*Concerns audit: 2026-03-30*
