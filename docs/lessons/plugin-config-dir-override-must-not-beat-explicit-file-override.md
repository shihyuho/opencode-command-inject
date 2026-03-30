---
id: plugin-config-dir-override-must-not-beat-explicit-file-override
date: 2026-03-30
scope: module
tags: [config, loader, env, precedence, docs]
source: bug-fix
confidence: 0.5
related: [[plugin-must-forward-global-prefix-config]]
---

# Directory-level config overrides must not outrank explicit file overrides

## Context

While adding `OPENCODE_CONFIG_DIR` support to `src/config/loader.ts`, the loader already had an explicit `OPENCODE_COMMAND_INJECT_CONFIG` file-path override that short-circuits normal config discovery.

## Mistake

It is easy to treat a new directory-level override as the new top precedence and accidentally weaken or bypass the explicit file-path override.

## Lesson

When extending config lookup with a directory-level env var, preserve any existing explicit file-path override as the highest-precedence path. Then layer the new directory preference underneath it, followed by the older fallback chain.

## When to Apply

Apply this whenever changing `src/config/loader.ts` or similar discovery code that mixes exact-path env vars with directory-based fallback lookup.
