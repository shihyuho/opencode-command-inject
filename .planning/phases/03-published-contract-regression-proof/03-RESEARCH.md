# Phase 3 Research: Published Contract & Regression Proof

**Date:** 2026-03-27
**Phase:** 03-published-contract-regression-proof
**Requirements:** CONF-01, CONF-02, CONF-03, TEST-01, TEST-02, TEST-03, TEST-04

## Summary

Phase 3 should finish the feature as a publishable contract rather than add new runtime behavior. The highest-value work is to align the three public surfaces with the already-shipped Phase 1 and Phase 2 behavior:

1. `opencode-command-inject.schema.json` must clearly expose the top-level disable-only control plus per-source override/custom-prefix fields (CONF-01).
2. `README.md` must show the common user entry points: global disable, per-source override, and custom prefix usage (CONF-02).
3. `docs/configuration.md` must become the authoritative reference for precedence, config shape, examples, and collision fallback behavior (CONF-03).
4. Automated tests should prove default compatibility, overrides/custom prefixes, and collision fallback/warnings with focused fast commands and a full-suite check (TEST-01..04).

No new dependency research is needed. This is Level 0/1 brownfield work: existing repo patterns, existing Vitest infrastructure, and already-established Phase 1/2 naming behavior.

## Current Gaps Observed

### README gaps
- `README.md` still documents only `sources.*` config examples and does not mention top-level `command_name_prefix.disable`.
- It does not teach the precedence model (global disable with per-source force-on/custom values).
- It does not mention collision fallback or warning behavior introduced in Phase 2.

### Configuration doc gaps
- `docs/configuration.md` still shows the pre-Phase-1 config structure and omits both top-level and source-level `command_name_prefix` sections.
- Existing examples contain stale keys (`enabled`) and malformed JSON blocks, so they are no longer trustworthy as the published contract.
- The document explains load precedence for config files, but not prefix-setting precedence or collision fallback outcomes.

### Schema / publication surface
- `opencode-command-inject.schema.json` already contains the new fields, but Phase 3 should treat the generated file plus matching docs as one published contract. Any doc or schema edits must stay synchronized.
- Because `src/config/types.ts` and `src/config/schema.ts` define the published contract, any plan that touches either file must include `bun run generate-schema` in the same plan per repo rules.

### Regression coverage posture
- Runtime coverage already exists in `src/command-sources/command-name-prefix.test.ts`, `src/command-sources/aggregator.test.ts`, and `src/plugin/command-inject.test.ts`.
- Phase 3 should avoid duplicating those assertions blindly. The gap is better organization/completeness around the four roadmap testing promises: default compatibility, overrides, custom prefixes, collision fallback warnings.
- A good Phase 3 plan should either tighten existing suites or add a focused regression-oriented test file only where it improves maintainability and requirement traceability.

## Affected Files / Seams

### Published contract
- `src/config/types.ts`
- `src/config/schema.ts`
- `opencode-command-inject.schema.json`
- `src/config/schema.test.ts`
- `src/config/types.test.ts`

### User docs
- `README.md`
- `docs/configuration.md`

### Regression proof
- `src/command-sources/command-name-prefix.test.ts`
- `src/command-sources/aggregator.test.ts`
- `src/plugin/command-inject.test.ts`
- Potentially one new focused regression file if requirement traceability is hard to express cleanly in existing suites

## Recommended Implementation Approach

## 1. Treat docs + schema as one contract update

Do not update `README.md`, `docs/configuration.md`, and schema-facing source files independently. The final contract users see should say the same thing in three places:

- top-level `command_name_prefix.disable` is global on/off only
- `sources.<source>.command_name_prefix.disable` can override the global behavior for one source
- `sources.<source>.command_name_prefix.value` sets `prefix:name` output when that source is effectively prefixed
- customized-name collisions fall back to canonical source-prefixed names, with warnings, while existing/config commands still win

This follows the repo’s established pattern that config contract changes land with matching type/schema/schema-artifact updates.

## 2. Keep README practical, keep configuration doc exhaustive

Use a split documentation strategy:

- `README.md`: short explanation, quick example(s), and links to detailed docs
- `docs/configuration.md`: full config structure, precedence rules, naming examples, and collision fallback explanation

This avoids bloating the README while still satisfying CONF-02 and CONF-03.

## 3. Organize tests by requirement coverage, not by subsystem alone

The current suites already prove most behavior. Phase 3 should make requirement coverage explicit:

- TEST-01 → no-config defaults remain canonical/current names
- TEST-02 → global disable and per-source override behavior
- TEST-03 → custom per-source prefix values and `prefix:name` outputs
- TEST-04 → source/plugin collision fallback plus warning text ownership

Use existing suites where possible:
- `command-name-prefix.test.ts` for pure naming-policy branches
- `plugin/command-inject.test.ts` for end-to-end config propagation and config/existing command precedence
- `aggregator.test.ts` for source-layer collision-group fallback and warning summaries

If a requirement is currently split awkwardly across too many suites, add one targeted regression test block or file rather than duplicating entire scenarios.

## Suggested Documentation Content

### README should include
- brief note that generated names stay unchanged by default
- top-level disable example
- per-source override/custom prefix example
- pointer to `docs/configuration.md`
- brief statement that customized collisions fall back to canonical source-prefixed names with warnings

### `docs/configuration.md` should include
- corrected config structure with `command_name_prefix` at top level and per-source
- prefix precedence rules, stated concretely:
  1. top-level `command_name_prefix.disable` applies globally
  2. `sources.<source>.command_name_prefix.disable` overrides the global setting for that source
  3. `sources.<source>.command_name_prefix.value` is used only when that source is effectively prefixed
- example outputs for makefile / npm-scripts / skills under default, global disable, source force-on, and custom prefix value
- collision fallback section describing Phase 2 behavior and stable warning prefixes:
  - `[command-sources]` for dynamic-source collisions
  - `[command-inject]` for existing/config command collisions

## Suggested Verification Commands
- `bunx vitest run src/config/schema.test.ts src/config/types.test.ts src/command-sources/command-name-prefix.test.ts src/command-sources/aggregator.test.ts src/plugin/command-inject.test.ts`
- `bun run generate-schema`
- `bun run test`

## Risks / Pitfalls

1. **Doc drift from runtime truth**
   - `docs/configuration.md` is already stale and partially malformed. The plan should require replacing stale examples, not patching around them.

2. **Schema edits without regeneration**
   - If Phase 3 updates `src/config/types.ts` or `src/config/schema.ts`, `bun run generate-schema` must happen in the same plan.

3. **Redundant regression coverage**
   - Adding brand-new suites for already-covered behavior may increase maintenance cost. Prefer tightening existing tests unless traceability genuinely suffers.

4. **Losing repo warning guarantees in docs/tests**
   - Published docs and tests must continue to reflect the current ownership split: `[command-sources]` vs `[command-inject]`.

5. **Accidentally widening scope into new naming features**
   - Phase 3 should publish and prove the existing behavior only. No new delimiter/global-prefix/custom collision strategy work.

## What Must Stay True

- Existing users with no new config still get current prefixed command names.
- Top-level config remains disable-only; custom prefix text remains source-owned.
- Existing/config-defined commands still beat injected commands on collisions.
- Warning prefixes remain stable: `[command-sources]` and `[command-inject]`.
- Published docs, typed config, zod schema, and generated JSON schema stay aligned.

## Validation Architecture

This phase is Nyquist-friendly and can validate mostly through automated checks:

- contract-level checks: schema/types/tests/docs mention the same prefix fields and behaviors
- focused behavior checks: naming helper + aggregator + plugin suites cover default, override/custom, and fallback branches
- full regression check: `bun run test`

Manual verification is not required if the docs contain exact field names, examples, and fallback behavior strings that can be checked by file reads/grep plus passing tests.
