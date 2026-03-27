# Roadmap: opencode-command-inject

## Overview

This roadmap delivers configurable generated command names without breaking the plugin's existing discovery and injection flow. The work is phased around the user-visible contract first, then collision-safe runtime behavior, then publication and regression proof so users and maintainers can trust the new naming controls.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Prefix Controls & Safe Defaults** - Deliver configurable prefix behavior while preserving today's names by default.
- [x] **Phase 2: Collision-Safe Naming** - Keep generated commands available and understandable when customized names collide.
- [x] **Phase 3: Published Contract & Regression Proof** - Publish the feature clearly and prove it with schema, docs, and automated coverage.

## Phase Details

### Phase 1: Prefix Controls & Safe Defaults
**Goal**: Users can control generated command prefixes without breaking existing projects that rely on current prefixed names.
**Depends on**: Nothing (first phase)
**Requirements**: PFX-01, PFX-02, PFX-03, PFX-04, SAFE-01
**Success Criteria** (what must be TRUE):
  1. User who adds no new configuration still sees the current source-prefixed generated command names unchanged.
  2. User can disable prefixes globally and see generated command names emitted without source prefixes unless a source override applies.
  3. User can override the global prefix setting for an individual source and see that source follow its own prefix behavior.
  4. User can set a custom prefix for a source and see generated command names rendered in `prefix:name` format.
**Plans**: 2 plans

Plans:
- [x] 01-prefix-controls-safe-defaults-01-PLAN.md — Extend the prefix config contract and shared command-name decision rules.
- [x] 01-prefix-controls-safe-defaults-02-PLAN.md — Apply prefix rules across sources, verify compatibility, and regenerate schema.

### Phase 2: Collision-Safe Naming
**Goal**: Users keep access to generated commands even when prefix removal or custom prefixes create name collisions.
**Depends on**: Phase 1
**Requirements**: SAFE-02, SAFE-03, SAFE-04
**Success Criteria** (what must be TRUE):
  1. User keeps access to all generated commands when prefix changes would otherwise make names collide.
  2. User sees colliding generated commands automatically fall back to canonical source-prefixed names instead of disappearing or silently overwriting each other.
  3. User receives a warning when collision fallback changes a generated command name.
**Plans**: 2 plans

Plans:
- [x] 02-collision-safe-naming-01-PLAN.md — Add command metadata and source-layer collision-group fallback with summary warnings.
- [x] 02-collision-safe-naming-02-PLAN.md — Apply plugin-layer fallback against existing/config commands and prove it with integration tests.

### Phase 3: Published Contract & Regression Proof
**Goal**: Users and maintainers can discover, understand, and verify the final prefix behavior through published artifacts and automated tests.
**Depends on**: Phase 2
**Requirements**: CONF-01, CONF-02, CONF-03, TEST-01, TEST-02, TEST-03, TEST-04
**Success Criteria** (what must be TRUE):
  1. User can discover the new top-level and per-source prefix settings through the published JSON Schema.
  2. User can learn global disable, per-source override, and custom prefix usage from `README.md`.
  3. User can learn configuration precedence, examples, and collision fallback behavior from `docs/configuration.md`.
  4. Maintainer can run automated tests that verify default compatibility, overrides, custom prefixes, and collision fallback warnings.
**Plans**: 2 plans

Plans:
- [x] 03-published-contract-regression-proof-01-PLAN.md — Publish the finalized naming-config contract across schema and docs.
- [x] 03-published-contract-regression-proof-02-PLAN.md — Turn the Phase 1/2 naming behavior into explicit automated regression proof.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Prefix Controls & Safe Defaults | 2/2 | Complete | 2026-03-26 |
| 2. Collision-Safe Naming | 2/2 | Complete | 2026-03-26 |
| 3. Published Contract & Regression Proof | 2/2 | Complete | 2026-03-27 |
