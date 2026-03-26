---
phase: 02
slug: collision-safe-naming
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | none — repository uses Vitest defaults via `bunx vitest run` |
| **Quick run command** | `bunx vitest run src/command-sources/aggregator.test.ts src/plugin/command-inject.test.ts src/command-sources/command-name-prefix.test.ts` |
| **Full suite command** | `bun run test` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `bunx vitest run src/command-sources/aggregator.test.ts src/plugin/command-inject.test.ts src/command-sources/command-name-prefix.test.ts`
- **After every plan wave:** Run `bun run test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | SAFE-02, SAFE-03 | unit | `bunx vitest run src/command-sources/command-name-prefix.test.ts src/command-sources/aggregator.test.ts` | ✅ | ⬜ pending |
| 02-01-02 | 01 | 1 | SAFE-04 | integration | `bunx vitest run src/command-sources/aggregator.test.ts` | ✅ | ⬜ pending |
| 02-02-01 | 02 | 2 | SAFE-02, SAFE-03 | integration | `bunx vitest run src/plugin/command-inject.test.ts` | ✅ | ⬜ pending |
| 02-02-02 | 02 | 2 | SAFE-04 | integration | `bunx vitest run src/plugin/command-inject.test.ts src/command-sources/aggregator.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
