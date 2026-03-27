# Codebase Concerns

**Analysis Date:** 2026-03-26

## Tech Debt

**Plugin SDK boundary uses an unsafe cast:**
- Issue: `createCommandInjectHooks()` injects a synthetic output part with `as any`, which bypasses type safety at the exact boundary where the plugin depends on `@opencode-ai/plugin` runtime behavior.
- Files: `src/plugin/command-inject.ts`
- Impact: A plugin SDK change to the output shape can turn command execution into a runtime failure even while `bun run typecheck` still passes.
- Fix approach: Replace the cast with an SDK-backed type, or add a local output-part type guard plus compatibility tests around `output.parts` mutation.

**Logging is split across ad-hoc consoles and injected loggers:**
- Issue: source loaders use `ctx.logger.warn`, but config loading and plugin setup call `console.warn` directly.
- Files: `src/plugin.ts`, `src/config/loader.ts`, `src/command-sources/types.ts`
- Impact: warnings are hard to route, suppress, or assert consistently; host applications cannot control all plugin diagnostics through one interface.
- Fix approach: thread a single logger through `loadPluginConfig()` and the plugin factory, then keep `warn`/`debug` behavior behind one shared logger contract.

**Custom parsers implement narrow subsets of external formats:**
- Issue: Makefile parsing and SKILL frontmatter parsing are hand-rolled and intentionally partial.
- Files: `src/command-sources/makefile-parser.ts`, `src/skills/frontmatter.ts`, `src/skills/load-skill.ts`
- Impact: valid real-world files can be skipped or misread silently, which makes command discovery look flaky instead of explicitly unsupported.
- Fix approach: either switch to hardened parsers or codify the supported subset in validation errors and docs so unsupported syntax fails loudly.

## Known Bugs

**Invalid env-config file disables fallback config resolution:**
- Symptoms: when `OPENCODE_COMMAND_INJECT_CONFIG` points to an invalid file, the loader returns `{}` and never checks user or project config locations.
- Files: `src/config/loader.ts`
- Trigger: set `OPENCODE_COMMAND_INJECT_CONFIG` to a file with invalid JSON, invalid JSONC, or schema-invalid content.
- Workaround: fix the env-config file or unset `OPENCODE_COMMAND_INJECT_CONFIG`.

**Variable substitution can corrupt values containing `$` replacement tokens:**
- Symptoms: prompt text built from `{description}`, `{instruction}`, or other variables can be mutated when values contain `$&`, `$1`, or similar replacement sequences.
- Files: `src/command-sources/variable-substitution.ts`, `src/command-sources/template.ts`, `src/command-sources/skill-source.ts`
- Trigger: use a custom `prompt` or `prompt_append` and feed it data from a skill body or description containing replacement tokens.
- Workaround: avoid `$` replacement sequences in configured prompt variables until substitution uses a replacer function instead of raw string replacement.

**Command injection hook assumes mutable `output.parts` exists:**
- Symptoms: `command.execute.before` mutates `output.parts` without checking that the array exists or that the host still accepts `{ type: "text", text }` parts.
- Files: `src/plugin/command-inject.ts`
- Trigger: host SDK changes, partial hook payloads, or alternate execution environments.
- Workaround: none in repo code; callers depend on current `@opencode-ai/plugin` behavior.

## Security Considerations

**Shell commands interpolate unescaped user arguments:**
- Risk: `$ARGUMENTS` is inserted directly into shell-oriented templates for Makefile and package-script commands.
- Files: `src/plugin/command-inject.ts`, `src/command-sources/template.ts`, `src/command-sources/makefile-source.ts`, `src/command-sources/npm-scripts-source.ts`
- Current mitigation: command execution is user-initiated and the plugin only injects templates; there is no escaping or validation layer.
- Recommendations: treat arguments as structured data or escape them for the shell before interpolation; add hostile-input tests for backticks, semicolons, subshells, and newlines.

**Skill discovery trusts local and home-directory prompt files by default:**
- Risk: any discovered `SKILL.md` under project or home roots becomes executable prompt content, including symlinked directories.
- Files: `src/plugin.ts`, `src/skills/discovery.ts`, `src/skills/load-skill.ts`, `README.md`
- Current mitigation: duplicate names are de-duplicated and empty skills are skipped.
- Recommendations: add trust controls such as allowlists, root-level opt-in, or a config switch that disables home-directory discovery unless explicitly enabled.

## Performance Bottlenecks

**Skill discovery is recursive and mostly serial:**
- Problem: `scanDirectory()` walks every nested directory under up to six roots, calls `loadSkill()` for each directory, and recurses depth-first with sequential awaits.
- Files: `src/skills/discovery.ts`, `src/skills/load-skill.ts`
- Cause: startup discovery favors simplicity over bounded traversal, batching, or depth limits.
- Improvement path: add a concurrency cap, skip descending once a directory is confirmed as a leaf skill when appropriate, and allow configured roots/depth to constrain the scan.

**All command sources load eagerly at startup:**
- Problem: Makefile parsing, package.json parsing, skill discovery, and duplicate aggregation all happen before hooks are returned.
- Files: `src/plugin.ts`, `src/plugin/command-inject.ts`, `src/command-sources/aggregator.ts`
- Cause: the plugin builds a full in-memory catalog up front instead of lazily resolving on demand.
- Improvement path: cache results between startups where supported, or lazily resolve expensive sources such as skill discovery.

## Fragile Areas

**Makefile parsing only supports simple target syntax:**
- Files: `src/command-sources/makefile-parser.ts`, `src/command-sources/makefile-source.ts`
- Why fragile: the regex only matches `[a-zA-Z0-9_-]+` targets and ignores common Make features such as path-like targets, pattern rules, multiple targets, and more complex declarations.
- Safe modification: expand parser support with focused tests before changing the regex; preserve current output for `target: ## description` cases covered in `src/command-sources/makefile-parser.test.ts`.
- Test coverage: no tests cover path separators, pattern targets, double-colon rules, or line continuations.

**Frontmatter parsing only recognizes `name` and `description` via a custom YAML subset:**
- Files: `src/skills/frontmatter.ts`, `src/skills/frontmatter.test.ts`, `src/skills/load-skill.ts`
- Why fragile: the parser accepts only a narrow subset of YAML semantics and can drift from how users expect markdown frontmatter to behave.
- Safe modification: keep the current tests intact, then add fixtures for quoted escapes, comments on scalar lines, indentation edge cases, and mixed newline styles before refactoring.
- Test coverage: common cases are covered, but full YAML compatibility is not.

**Duplicate resolution depends on source order and warning logs:**
- Files: `src/plugin.ts`, `src/plugin/command-inject.ts`, `src/command-sources/aggregator.ts`
- Why fragile: conflicts are resolved by "first one wins" ordering across manual skills, discovered skills, existing commands, and dynamic sources.
- Safe modification: treat precedence as a public contract and add explicit integration tests before reordering sources.
- Test coverage: duplicate cases are covered for a few paths, but not for all cross-source combinations.

## Scaling Limits

**Command catalog size grows linearly with discovered scripts, targets, and skills:**
- Current capacity: appropriate for small and medium repositories with modest local skill sets.
- Limit: startup work and injected `config.command` size both expand with every discovered item because `createCommandInjectHooks()` materializes the full catalog in memory.
- Scaling path: add filtering, lazy loading, or source-specific opt-in so very large monorepos and shared home skill collections do not inject every available command.

## Dependencies at Risk

**`@opencode-ai/plugin` shape changes can bypass compile-time safety:**
- Risk: the repository relies on the plugin contract for hook payload shapes while mutating output using an `any` cast.
- Impact: a minor SDK change can break command injection at runtime.
- Migration plan: pin compatibility tests to the hook payload shape and remove the cast in `src/plugin/command-inject.ts`.

## Missing Critical Features

**No trust boundary for discovered skills:**
- Problem: the plugin auto-loads prompt content from project and home skill directories without an explicit trust decision.
- Blocks: safe use in environments where repositories or shared home directories are not fully trusted.

**No escaping or validation layer for shell-bound arguments:**
- Problem: argument handling is direct text substitution instead of shell-safe command construction.
- Blocks: robust support for arbitrary user arguments and safer execution in automation-heavy workflows.

## Test Coverage Gaps

**Shell escaping and hostile input paths are untested:**
- What's not tested: argument values containing shell metacharacters, quotes, subshells, or multi-line input.
- Files: `src/plugin/command-inject.ts`, `src/command-sources/template.ts`, `src/command-sources/makefile-source.ts`, `src/command-sources/npm-scripts-source.ts`
- Risk: command execution behavior can become unsafe or malformed without failing the current test suite.
- Priority: High

**Config-loader fallback after invalid env config is untested:**
- What's not tested: behavior when `OPENCODE_COMMAND_INJECT_CONFIG` exists but contains invalid JSON, invalid JSONC, or schema-invalid data.
- Files: `src/config/loader.ts`, `src/config/loader.test.ts`
- Risk: a broken env-config can silently disable valid user or project configuration.
- Priority: High

**Parser edge cases beyond the happy path are thinly covered:**
- What's not tested: advanced Makefile syntax and YAML frontmatter edge cases that appear in real repositories.
- Files: `src/command-sources/makefile-parser.ts`, `src/command-sources/makefile-parser.test.ts`, `src/skills/frontmatter.ts`, `src/skills/frontmatter.test.ts`
- Risk: discovery failures surface as missing commands rather than actionable parser errors.
- Priority: Medium

---

*Concerns audit: 2026-03-26*
