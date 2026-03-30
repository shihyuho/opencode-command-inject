---
id: map-codebase-artifacts-may-need-force-add
date: 2026-03-30
scope: project
tags: [gsd, codebase-map, gitignore, planning, git]
source: bug-fix
confidence: 0.5
related: []
---

# Map-codebase artifacts may need force-add when `.planning/` is ignored

## Context
During `/gsd-map-codebase`, the mapper agents successfully wrote all seven `.planning/codebase/*.md` documents, but the repo-level `.gitignore` ignored `.planning/` entirely.

## Mistake
Relying on `gsd-tools commit` alone left the workflow unable to create the required docs commit because the generated files were classified as `skipped_gitignored`.

## Lesson
- If this repo still ignores `.planning/`, expect `.planning/codebase/*.md` to be skipped by normal GSD docs commits.
- For `/gsd-map-codebase`, verify the generated docs exist, then use `git add -f .planning/codebase/*.md` before committing so the workflow can finish cleanly.

## When to Apply
Apply this whenever a GSD workflow generates files under `.planning/` that are meant to be committed in a repo whose `.gitignore` currently ignores the whole `.planning/` tree.
