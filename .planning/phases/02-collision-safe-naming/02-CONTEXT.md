# Phase 2: Collision-Safe Naming - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

When prefix disable or custom prefix values cause generated command-name collisions, preserve access to the affected generated commands by falling back to canonical source-prefixed names and warning the user clearly. This phase does not redesign all duplicate handling; collisions unrelated to the new prefix feature keep existing behavior.

</domain>

<decisions>
## Implementation Decisions

### Fallback trigger boundary
- **D-01:** Canonical-prefix fallback applies at both existing collision gates: dynamic-source aggregation collisions and dynamic-vs-existing command/config collisions.
- **D-02:** Phase 2 fallback only handles collisions newly introduced by prefix disable or custom prefix values.
- **D-03:** If a collision would already exist without the Phase 1 prefix feature, keep the current deterministic keep-first behavior instead of treating it as Phase 2 fallback work.

### Fallback scope
- **D-04:** Fallback affects only the commands in the actual collision group; unrelated commands keep the user-requested naming behavior.
- **D-05:** When a collision group is resolved by fallback, all commands in that group fall back together to their own canonical source-prefixed names.
- **D-06:** A collision in one command group must not force an entire source back to canonical naming.

### Warning contract
- **D-07:** Emit one summary warning per collision group, not one warning per renamed command.
- **D-08:** Each summary warning must identify the collided generated name, the commands/sources involved, and the final fallback names assigned to the affected commands.
- **D-09:** Preserve existing logger ownership boundaries: source-to-source collision fallback warnings use `[command-sources]`, while dynamic-vs-existing collision fallback warnings use `[command-inject]`.

### Final convergence
- **D-10:** If canonical fallback still does not produce unique names, fall back to the existing deterministic keep-first behavior rather than inventing a second renaming scheme in Phase 2.
- **D-11:** In that unresolved case, the warning must say that canonical fallback was attempted and that the final result still used keep-first behavior.

### the agent's Discretion
- Exact internal representation for "collision introduced by prefix customization" detection.
- Whether fallback is implemented by returning richer metadata from name building, doing a second-pass rename phase, or another approach that preserves the decisions above.
- Exact warning string wording, as long as it keeps the required details and stable log prefixes.
- Exact test fixture shape and helper structure, following existing Vitest + temp-dir patterns.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and locked decisions
- `.planning/ROADMAP.md` — Phase 2 goal, success criteria, and boundary relative to Phase 1 and Phase 3.
- `.planning/PROJECT.md` — Product constraints: default compatibility, `prefix:name` naming, and collision handling direction.
- `.planning/REQUIREMENTS.md` — SAFE-02, SAFE-03, SAFE-04 define the required user-visible outcome for fallback and warnings.
- `.planning/STATE.md` — Current project position and previously noted collision/warning concerns.
- `.planning/phases/01-prefix-controls-safe-defaults/01-CONTEXT.md` — Phase 1 decisions that Phase 2 must carry forward, especially prefix precedence and the explicit defer of collision fallback/warning behavior.

### Existing architecture and runtime conventions
- `.planning/codebase/ARCHITECTURE.md` — Current aggregation/injection flow and where duplicate handling already occurs.
- `.planning/codebase/CONVENTIONS.md` — Recoverable warning behavior and required log prefixes `[command-inject]` / `[command-sources]`.
- `.planning/codebase/TESTING.md` — Existing Vitest and temp-dir testing patterns for downstream verification.

### Supporting design references
- `docs/superpowers/specs/2026-03-16-command-inject-config-design.md` — Config precedence, deep-merge behavior, and plugin-to-source wiring assumptions that Phase 2 must preserve.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/command-sources/command-name-prefix.ts`: current shared name builder and the likely seam for canonical-name fallback metadata or second-pass coordination.
- `src/command-sources/aggregator.ts`: existing cross-source duplicate gate and `[command-sources]` warning path.
- `src/plugin/command-inject.ts`: existing dynamic-vs-existing duplicate gate and `[command-inject]` warning path.
- `src/command-sources/skill-source.ts`: source-local duplicate handling that already deduplicates normalized skill names before cross-source aggregation.

### Established Patterns
- Recoverable runtime issues warn and fall back safely instead of crashing.
- Duplicate handling is currently deterministic keep-first at every layer; Phase 2 extends this only for prefix-feature collisions rather than replacing the whole duplicate model.
- Existing commands and config-defined commands must never be overwritten by injected commands.

### Integration Points
- `src/command-sources/command-name-prefix.ts` plus source adapters: determine whether a command is using canonical vs customized naming.
- `src/command-sources/aggregator.ts`: resolve collision groups between dynamic sources and emit source-layer fallback warnings.
- `src/plugin/command-inject.ts`: resolve collision groups against existing commands/config and emit plugin-layer fallback warnings.
- `src/command-sources/*.test.ts`, `src/plugin/command-inject.test.ts`, and `src/command-sources/aggregator.test.ts`: extend coverage for fallback groups, summary warnings, and canonical-fallback failure cases.

</code_context>

<specifics>
## Specific Ideas

- Phase 2 should not invent a second custom naming scheme after canonical fallback; if canonical still collides, stop at the existing keep-first behavior and explain that explicitly.
- Warning output should help the user understand both the collided customized name and the final canonical names that survived.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-collision-safe-naming*
*Context gathered: 2026-03-26*
