# Phase 1: Prefix Controls & Safe Defaults - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver configurable generated-command prefix behavior for makefile, npm-scripts, and skill sources while preserving today's generated names for users who add no new configuration. This phase covers global prefix enable/disable, per-source override behavior, and per-source custom prefix values. Collision fallback strategy and warning contract stay in Phase 2.

</domain>

<decisions>
## Implementation Decisions

### Prefix precedence
- **D-01:** Top-level `command_name_prefix` remains a global enable/disable switch only; it does not own a custom prefix string.
- **D-02:** Each source has three effective states: inherit, force on, force off.
- **D-03:** Source-level prefix config continues to follow existing user-config + project-config field-by-field deep merge semantics.
- **D-04:** If global prefixing is off and a source provides only a custom prefix `value`, treat that `value` as invalid for activation; keep the source unprefixed.
- **D-05:** The invalid `value`-while-global-off case is ignored silently with no warning.
- **D-06:** When a source is force-enabled without a custom `value`, use that source's existing canonical prefix.

### Generated name outputs
- **D-07:** When prefixing is off for a source, emit the raw command name with no source prefix: makefile uses the target name, npm-scripts uses the script name, and skill uses the normalized skill name.
- **D-08:** For skill commands with nested namespaces, removing the outer `skill:` prefix must still preserve the remaining namespace structure (for example `review:security`).
- **D-09:** For npm-scripts canonical naming, keep the current runner-based prefix (`pnpm:`, `npm:`, `bun:`) rather than replacing it with a fixed source label.
- **D-10:** When a source defines a custom prefix `value`, that value fully replaces the canonical prefix and the emitted command name must be `value:name`.
- **D-11:** Custom prefix `value` support applies consistently across all Phase 1 sources: makefile, npm-scripts, and skill.

### Safe defaults
- **D-12:** A user who adds no new prefix configuration must keep today's generated command names unchanged.
- **D-13:** Phase 1 must not introduce a new collision-resolution behavior or warning contract; downstream planning should treat those as Phase 2 work.

### the agent's Discretion
- Exact config field naming and schema encoding, as long as they preserve the decisions above and fit the existing top-level + `sources.<source>` config shape.
- Exact normalization helpers and internal branching used to derive canonical vs custom names.
- Test case structure and fixture setup, following existing Vitest + temp-dir patterns.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, and explicit boundary vs Phase 2.
- `.planning/PROJECT.md` — Product direction, constraints, and the locked choice that top-level config is enable/disable only.
- `.planning/REQUIREMENTS.md` — Requirement mapping for global disable, per-source override, custom prefix value, `prefix:name` format, and compatibility-by-default.
- `.planning/STATE.md` — Current blockers to keep in mind during planning, especially merge semantics and warning-boundary concerns.

### Existing architecture and conventions
- `.planning/codebase/ARCHITECTURE.md` — Config loading, source aggregation, injection flow, and duplicate handling patterns.
- `.planning/codebase/CONVENTIONS.md` — Recoverable-warning conventions and required log prefixes.
- `.planning/codebase/TESTING.md` — Existing Vitest and temp-dir testing patterns for downstream coverage planning.

### Existing design/spec references
- `docs/superpowers/specs/2026-03-16-command-inject-config-design.md` — Existing config precedence, optional-field philosophy, and config integration shape.
- `README.md` — Published user-facing command naming behavior to keep aligned in later phases.
- `docs/configuration.md` — Current configuration contract that Phase 3 will need to update consistently with runtime behavior.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/config/loader.ts`: already provides env → user → project loading and nested deep merge for `sources` entries.
- `src/config/types.ts` / `src/config/schema.ts`: current config surface to extend for new prefix controls.
- `src/command-sources/makefile-source.ts`: canonical makefile naming currently emits `make:<target>`.
- `src/command-sources/npm-scripts-source.ts`: canonical npm-scripts naming currently emits `<runner>:<script>`.
- `src/command-sources/skill-source.ts` + `src/skills/normalize-skill-name.ts`: canonical skill naming currently emits `skill:<normalized-name>` and already preserves nested namespaces after the outer prefix.

### Established Patterns
- Recoverable config and discovery issues warn and fall back safely instead of crashing.
- Duplicate generated command names currently use warning + keep-first behavior in `src/command-sources/aggregator.ts` and `src/plugin/command-inject.ts`.
- Existing command/config-defined commands must not be overwritten by injected commands.
- New config should fit the existing top-level plus `sources.<source>` schema shape rather than a separate namespace.

### Integration Points
- `src/config/types.ts` and `src/config/schema.ts`: add the prefix-control fields and validation shape.
- `src/config/loader.ts`: preserve current merge semantics when combining prefix settings.
- `src/command-sources/makefile-source.ts`, `src/command-sources/npm-scripts-source.ts`, `src/command-sources/skill-source.ts`: apply the final naming decisions when creating `CommandInfo.name`.
- `scripts/generate-schema.ts` and `opencode-command-inject.schema.json`: must stay in sync if schema/types change.

</code_context>

<specifics>
## Specific Ideas

- For skills, removing the source prefix should behave like dropping only the outer `skill:` marker, not flattening the skill's own namespace structure.
- For npm-scripts, canonical naming should continue to feel native to the detected runner instead of being normalized into a generic source label.

</specifics>

<deferred>
## Deferred Ideas

- Collision fallback behavior when customized names collide — explicitly deferred to Phase 2.
- Warning text contract for collision fallback — explicitly deferred to Phase 2.

</deferred>

---

*Phase: 01-prefix-controls-safe-defaults*
*Context gathered: 2026-03-26*
