---
id: phase-complete-needs-artifact-consistency-check
date: 2026-03-27
scope: project
tags: [gsd, planning, roadmap, state, requirements]
source: retrospective
confidence: 0.3
related: []
---

# Phase completion still needs a final consistency check across planning artifacts

## Context
During Phase 03 execute-phase completion, `gsd-tools phase complete 03` returned success but left `ROADMAP.md`, `REQUIREMENTS.md`, and `STATE.md` out of sync with the actual verified result.

## Mistake
Relying on the CLI success response alone would have reported the phase as complete even though the planning artifacts still showed stale plan counts, pending requirements, and an executing state.

## Lesson
- After any phase-complete command, spot-check `ROADMAP.md`, `REQUIREMENTS.md`, `STATE.md`, and `PROJECT.md` before final reporting.
- If the CLI output and artifact contents disagree, fix the artifacts first and only then create the completion handoff/commit.

## When to Apply
Apply this after any GSD phase completion flow, especially when execution involved multiple plans, parallel agents, or a verifier-generated completion path.
