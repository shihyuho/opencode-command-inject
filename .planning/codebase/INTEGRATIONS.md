# External Integrations

**Analysis Date:** 2026-03-26

## APIs & External Services

**Plugin Host:**
- OpenCode plugin runtime - host platform that loads this package and executes hooks
  - SDK/Client: `@opencode-ai/plugin` used in `src/plugin.ts` and `src/plugin/command-inject.ts`
  - Auth: Not handled by this repository; delegated to the OpenCode host

**Package Distribution:**
- npm registry - package publishing target for releases
  - SDK/Client: npm CLI invoked by `.github/workflows/release-npm.yml`
  - Auth: GitHub Actions OIDC/provenance flow in `.github/workflows/release-npm.yml`; no repository secret file detected

**Release Automation:**
- GitHub Actions + Release Please - CI, release PR creation, and release orchestration
  - SDK/Client: `googleapis/release-please-action@v4`, `actions/checkout@v6`, `oven-sh/setup-bun@v2`, `actions/setup-node@v5` in `.github/workflows/*.yml`
  - Auth: GitHub Actions workflow permissions in `.github/workflows/release-please.yml` and `.github/workflows/release-npm.yml`

**Schema Distribution:**
- unpkg - public CDN endpoint for the published JSON Schema referenced in `README.md` and `docs/configuration.md`
  - SDK/Client: Not used at runtime; URL reference only
  - Auth: None

**Local Skill Discovery:**
- Local filesystem skill directories - discovers agent skills from `.opencode`, `.claude`, `.agents`, and user home config trees
  - SDK/Client: Node filesystem APIs in `src/skills/discovery.ts` and `src/skills/load-skill.ts`
  - Auth: File-system permissions only

## Data Storage

**Databases:**
- Not detected

**File Storage:**
- Local filesystem only
  - Reads `package.json` in `src/command-sources/npm-scripts-source.ts`
  - Reads `Makefile` in `src/command-sources/makefile-source.ts`
  - Reads `SKILL.md` files in `src/skills/load-skill.ts`
  - Reads config files from project and user config directories in `src/config/loader.ts`

**Caching:**
- None detected

## Authentication & Identity

**Auth Provider:**
- None for application runtime
  - Implementation: the plugin itself does not authenticate users or call protected APIs; it runs inside OpenCode and reads local files via `src/plugin.ts` and `src/config/loader.ts`

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- Standard warning/debug logging through `console.warn` and optional logger methods in `src/plugin.ts`, `src/config/loader.ts`, `src/plugin/command-inject.ts`, and `src/skills/discovery.ts`

## CI/CD & Deployment

**Hosting:**
- npm package distribution for OpenCode plugin consumption, defined by `package.json`

**CI Pipeline:**
- GitHub Actions test pipeline in `.github/workflows/test.yml`
- GitHub Actions release PR automation in `.github/workflows/release-please.yml`
- GitHub Actions npm publish pipeline in `.github/workflows/release-npm.yml`

## Environment Configuration

**Required env vars:**
- No required runtime secrets detected
- Optional: `OPENCODE_COMMAND_INJECT_CONFIG` in `src/config/loader.ts`
- Optional: `XDG_CONFIG_HOME` in `src/config/loader.ts`

**Secrets location:**
- No application secret files detected in the repository root during this audit
- CI credentials are expected to come from GitHub Actions permissions/OIDC in `.github/workflows/release-npm.yml`

## Webhooks & Callbacks

**Incoming:**
- None in application runtime
- GitHub Actions workflow triggers only: push, pull_request, and workflow_dispatch in `.github/workflows/test.yml`; push/workflow_dispatch in `.github/workflows/release-npm.yml`; push to `main` in `.github/workflows/release-please.yml`

**Outgoing:**
- npm publish request from `.github/workflows/release-npm.yml` to `https://registry.npmjs.org`
- Release Please GitHub API activity is implied by `googleapis/release-please-action@v4` in `.github/workflows/release-please.yml`

---

*Integration audit: 2026-03-26*
