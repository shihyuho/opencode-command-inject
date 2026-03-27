# Domain Pitfalls

**Domain:** Configurable command naming for an existing OpenCode command-injection plugin
**Researched:** 2026-03-26

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Breaking the stable default naming contract
**What goes wrong:** Adding `command_name_prefix` changes names for users who never opted into the feature, or changes behavior for only some sources because defaults are inferred inconsistently.
**Why it happens:** Teams treat the new config as “just additive,” but command names are already public API: docs, user habits, slash-command muscle memory, and existing config all depend on current names like `make:build` and `skill:review`.
**Consequences:** Silent breaking change, confusing upgrades, mismatched docs/examples, and a semver violation if released as a minor feature.
**Prevention:**
- Keep `undefined` meaning “preserve current prefixed naming.”
- Add explicit no-config regression tests for all three sources.
- Treat generated command names as public API in release notes and acceptance criteria.
- Do not infer new defaults from schema metadata alone.
**Detection / Warning signs:**
- Snapshot/integration tests change when config is absent.
- README examples and runtime output diverge.
- Existing users report “commands disappeared” when names actually changed.
**Phase should address it:** Phase 1 - config contract and compatibility design.

### Pitfall 2: Implementing collision fallback in multiple places
**What goes wrong:** One part of the pipeline resolves duplicates with “first wins,” while another part applies fallback-to-prefixed naming later, producing different outcomes depending on source order or whether the conflict is against existing commands vs dynamic commands.
**Why it happens:** The current plugin already has two duplicate boundaries: `aggregateCommandSources()` resolves dynamic-source conflicts, then `createCommandInjectHooks()` resolves conflicts against existing commands. Adding fallback logic on top of both without a single naming-resolution step creates split-brain behavior.
**Consequences:** Non-deterministic command catalogs, hard-to-explain warnings, and bugs that only appear for certain source combinations.
**Prevention:**
- Centralize name resolution into one deterministic pass over the full candidate set.
- Define precedence as a public contract: existing commands vs dynamic commands, and within dynamic commands by source order.
- Compute fallback names before final dedupe, not after partial dedupe has already removed candidates.
**Detection / Warning signs:**
- Same source pair behaves differently depending on whether one command came from `existingCommands` or a dynamic source.
- Warnings mention duplicates, but final chosen names differ between startup paths.
- Reordering source registration changes command names.
**Phase should address it:** Phase 2 - naming-resolution architecture.

### Pitfall 3: Undefined merge semantics for nested naming config
**What goes wrong:** User config and project config combine into half-inherited naming settings, such as global disable at one level plus source-level custom prefix remnants from another level.
**Why it happens:** The loader deep-merges `sources.*` today. If naming config becomes an object (for example `command_name_prefix.value`), partial overrides can unintentionally inherit old subfields unless the merge contract is specified up front.
**Consequences:** “Why is this prefix still here?” bugs, hard-to-reproduce environment-specific behavior, and support issues caused by user/project config interaction.
**Prevention:**
- Specify merge semantics per field: inherit, replace-whole-object, or clear with explicit value.
- Prefer a schema shape that makes partial inheritance obvious.
- Add tests for user-only, project-only, merged, and env-config paths.
**Detection / Warning signs:**
- Project config changes only one naming field, but another old naming field still affects output.
- Behavior differs between local runs and CI/shared config setups.
- Review comments include “what happens if user config sets X and project config sets Y?”
**Phase should address it:** Phase 1 - schema/config design.

### Pitfall 4: Schema, docs, and runtime drifting apart
**What goes wrong:** Runtime supports new naming keys, but `opencode-command-inject.schema.json`, README, or `docs/configuration.md` do not; or docs describe behavior that runtime silently strips or rejects.
**Why it happens:** This plugin publishes generated schema and docs separately from runtime code. The current code uses Zod object parsing, which strips unknown keys by default, while the published JSON Schema uses `additionalProperties: false`. If only some layers are updated, users get autocomplete errors, silent no-ops, or stale examples.
**Consequences:** Broken editor UX, false bug reports, and config that “looks valid” in one place but not another.
**Prevention:**
- Update runtime types, Zod schema, generated JSON Schema, README, and `docs/configuration.md` in the same change.
- Regenerate schema every time config types/schema change.
- Add a doc/schema parity checklist or test.
**Detection / Warning signs:**
- New key works only when typed manually, not in editor autocomplete.
- Docs mention `command_name_prefix`, but published schema rejects it.
- Runtime ignores a key with no warning because Zod stripped it.
**Phase should address it:** Phase 3 - documentation/schema publication.

### Pitfall 5: Missing the real collision test matrix
**What goes wrong:** Tests cover one happy-path duplicate, but miss the actual risky cases: prefix disabled on one source only, custom prefix matching another source, conflict with pre-existing commands, and fallback after merge-loaded config.
**Why it happens:** Current tests cover simple duplicate keep-first behavior and basic config merge, but not the new cross-product introduced by configurable naming.
**Consequences:** Regressions ship even though unit tests are green.
**Prevention:**
- Build a table-driven matrix covering source × naming mode × conflict target.
- Include no-config regression tests and explicit fallback-path tests.
- Test both the final injected config and warning output.
**Detection / Warning signs:**
- New tests are all single-source.
- No test asserts final names after fallback.
- Existing-command conflicts are tested separately from dynamic-source conflicts but not together.
**Phase should address it:** Phase 4 - verification and regression coverage.

## Moderate Pitfalls

### Pitfall 1: Allowing malformed or ambiguous custom prefixes
**What goes wrong:** Empty prefixes, extra colons, whitespace, or source prefixes that normalize to the same visible command name produce malformed or confusing slash commands.
**Prevention:**
- Validate prefix values strictly.
- Reject empty strings and values that would violate the fixed `prefix:name` format.
- Normalize before collision detection, not after.
**Detection / Warning signs:**
- Commands like `:build`, `foo:bar:baz`, or names that differ only by whitespace/case handling.
**Phase should address it:** Phase 1 - schema validation rules.

### Pitfall 2: Silent fallback with poor diagnostics
**What goes wrong:** The plugin silently renames a command back to prefixed form after a collision, but the user cannot tell why their requested naming mode was not honored.
**Prevention:**
- Log actionable warnings including source, requested name, conflicting name, and final fallback name.
- Keep warning phrasing stable enough to assert in tests.
**Detection / Warning signs:**
- Users report “prefix disable doesn’t work” when it actually collided and fell back.
- Logs only say “duplicate command” without naming the fallback result.
**Phase should address it:** Phase 2 - runtime UX and observability.

## Minor Pitfalls

### Pitfall 1: Forgetting migration-oriented examples
**What goes wrong:** Docs explain the new keys but do not show “old default behavior unchanged,” “global disable,” and “per-source override,” so users over-apply config and create avoidable collisions.
**Prevention:**
- Add examples for default/no-config, global off, per-source override, and collision fallback.
**Detection / Warning signs:**
- Docs show only custom-prefix examples.
- Reviewers need to infer behavior from prose rather than examples.
**Phase should address it:** Phase 3 - docs polish.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Config contract | Backward compatibility broken by new implicit defaults | Freeze `undefined => current prefixed behavior`; add no-config regression tests |
| Schema design | Nested naming object deep-merges into surprising hybrids | Define merge semantics explicitly and test user/project/env precedence |
| Naming engine | Fallback logic split across aggregator and injection layers | Centralize naming resolution before dedupe |
| Validation | Invalid custom prefixes create malformed command names | Add strict schema/runtime validation for allowed prefix values |
| Docs + schema | Runtime supports keys that schema/docs do not | Update all config surfaces together and regenerate schema |
| Testing | Only happy-path duplicates covered | Add matrix tests for cross-source conflicts, existing commands, and fallback warnings |

## Sources

- Repository code: `src/command-sources/aggregator.ts`, `src/plugin/command-inject.ts`, `src/config/loader.ts`, `src/config/schema.ts`, `src/config/types.ts` — **HIGH** confidence for current plugin behavior
- Repository tests: `src/command-sources/aggregator.test.ts`, `src/config/loader.test.ts`, `src/plugin/command-inject.test.ts` — **HIGH** confidence for current coverage and gaps
- Project context: `.planning/PROJECT.md`, `.planning/codebase/CONCERNS.md`, `docs/configuration.md`, `README.md`, `opencode-command-inject.schema.json` — **HIGH** confidence for milestone constraints and published contract
- JSON Schema annotations reference: https://json-schema.org/understanding-json-schema/reference/annotations — `default` is documentation/annotation, not runtime filling — **HIGH** confidence
- Semantic Versioning 2.0.0: https://semver.org/ — backward-incompatible public API changes require major version bump — **HIGH** confidence
- Zod docs via Context7 (`/colinhacks/zod`) — object schemas strip unknown keys by default unless made strict — **HIGH** confidence
