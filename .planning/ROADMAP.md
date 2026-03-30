# Roadmap: opencode-command-inject

## Overview

This roadmap stays intentionally small because the active v1 scope is a single brownfield capability: add `OPENCODE_CONFIG_DIR` support for plugin-owned config/assets while preserving this repo's existing OpenCode config path semantics, recoverable fallbacks, warning contracts, and artifact gates.

## Phases

- [ ] **Phase 1: Config Directory Semantics** - Add and lock down `OPENCODE_CONFIG_DIR` support without expanding main OpenCode config path rules.

## Phase Details

### Phase 1: Config Directory Semantics
**Goal**: The plugin supports `OPENCODE_CONFIG_DIR` for its own config/assets while keeping current config lookup semantics, recoverable fallbacks, and repo guardrails intact.
**Depends on**: Nothing (first phase)
**Requirements**: CFGDIR-01, CFGDIR-02, CFGDIR-03
**Success Criteria** (what must be TRUE):
  1. In this repo's config-loading and discovery flows, setting `OPENCODE_CONFIG_DIR` causes plugin-owned config/assets to resolve from that directory without redefining how the main OpenCode config file path is located.
  2. When `OPENCODE_CONFIG_DIR` is unset, missing, or points to unreadable content, the plugin keeps existing `OPENCODE_COMMAND_INJECT_CONFIG`, `XDG_CONFIG_HOME`, and `~/.config` semantics, logs recoverable warnings with the existing prefixes, and does not crash.
  3. Automated tests explicitly pin the precedence and fallback behavior between `OPENCODE_CONFIG_DIR`, existing env/config paths, and failure cases so regressions are visible in CI.
  4. Repo-facing docs and config artifacts clearly record the supported semantics, and if config types/schema are touched, the generated schema stays in sync with the source contract.
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Config Directory Semantics | 0/TBD | Not started | - |
