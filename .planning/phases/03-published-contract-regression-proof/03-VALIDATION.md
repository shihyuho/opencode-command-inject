---
phase: 3
slug: published-contract-regression-proof
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-27
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | none — repository uses default Vitest config |
| **Quick run command** | `bunx vitest run src/config/schema.test.ts src/config/types.test.ts src/command-sources/command-name-prefix.test.ts src/command-sources/aggregator.test.ts src/plugin/command-inject.test.ts` |
| **Full suite command** | `bun run test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `bunx vitest run src/config/schema.test.ts src/config/types.test.ts src/command-sources/command-name-prefix.test.ts src/command-sources/aggregator.test.ts src/plugin/command-inject.test.ts`
- **After every plan wave:** Run `bun run test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | CONF-01 | schema + unit | `bunx vitest run src/config/schema.test.ts src/config/types.test.ts && bun run generate-schema` | ✅ | ⬜ pending |
| 3-01-02 | 01 | 1 | CONF-02, CONF-03 | docs contract | `bunx vitest run src/config/schema.test.ts src/config/types.test.ts src/command-sources/command-name-prefix.test.ts src/command-sources/aggregator.test.ts src/plugin/command-inject.test.ts` | ✅ | ⬜ pending |
| 3-02-01 | 02 | 2 | TEST-01, TEST-02 | regression | `bunx vitest run src/plugin/command-inject.test.ts src/command-sources/command-name-prefix.test.ts` | ✅ | ⬜ pending |
| 3-02-02 | 02 | 2 | TEST-03, TEST-04 | regression | `bunx vitest run src/command-sources/aggregator.test.ts src/plugin/command-inject.test.ts && bun run test` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
