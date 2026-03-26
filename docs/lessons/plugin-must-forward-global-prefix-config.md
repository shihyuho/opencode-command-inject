---
id: plugin-must-forward-global-prefix-config
date: 2026-03-26
scope: module
tags: [plugin, config, command-sources, prefixing, integration]
source: retrospective
confidence: 0.3
related: []
---

# Plugin orchestration must forward global prefix config to source adapters

## Context
Phase 1 split the prefix feature into a config/helper plan and a runtime wiring plan. Source adapters learned how to apply global prefix state, but plugin integration still constructed them without the top-level config.

## Mistake
I updated source-level logic and unit tests first, but the plugin layer still passed only per-source config. Mixed integration behavior silently stayed wrong until plugin-level tests checked global disable plus source overrides together.

## Lesson
- When a new feature adds top-level config that affects source adapters, trace the config path through the plugin/factory/orchestration layer before considering runtime wiring complete.
- Add or strengthen integration tests that combine global config with per-source overrides so constructor wiring mistakes fail fast.

## When to Apply
Apply this when config work is split across helper/type changes and later runtime wiring, especially when adapters are instantiated indirectly through plugin setup or factory code.
