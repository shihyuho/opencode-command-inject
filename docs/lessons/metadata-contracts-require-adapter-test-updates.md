---
id: metadata-contracts-require-adapter-test-updates
date: 2026-03-26
scope: module
tags: [command-sources, metadata, tests, adapters, integration]
source: bug-fix
confidence: 0.5
related: []
---

# Metadata contract changes must update adapter tests with the runtime shape

## Context
Phase 2 changed generated commands from string-only records into objects carrying `sourceId`, `canonicalName`, and `usedCustomizedName` so later duplicate gates could classify customized collisions.

## Mistake
I updated the naming helper and plugin collision logic first, but older makefile/npm adapter tests still asserted exact string-only command objects. Full-suite verification failed late even though the targeted plugin tests were already green.

## Lesson
- When a shared command/helper contract adds runtime metadata, trace that shape through every adapter that emits the object, not just the downstream consumer that needs the new fields.
- Update any exact-equality source tests in the same pass so the full suite validates the new contract instead of blocking later integration work.

## When to Apply
Apply this when a shared runtime object (command records, config payloads, DTOs, event shapes) gains new fields and downstream work depends on those fields across multiple adapters or factories.
