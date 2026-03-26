# Requirements: opencode-command-inject

**Defined:** 2026-03-26
**Core Value:** Users can expose project commands in OpenCode with predictable, configurable names without breaking the plugin's existing discovery and injection workflow.

## v1 Requirements

### Prefix Controls

- [x] **PFX-01**: User can disable command name prefixes globally through top-level plugin configuration
- [x] **PFX-02**: User can override global prefix enablement for an individual source
- [x] **PFX-03**: User can set a custom command name prefix string for an individual source
- [x] **PFX-04**: Custom source prefixes render generated command names in `prefix:name` format

### Compatibility and Safety

- [x] **SAFE-01**: User who does not configure the new feature keeps the current source-prefixed command names unchanged
- [x] **SAFE-02**: User does not lose access to commands when prefix removal or customization causes a generated-name collision
- [x] **SAFE-03**: User sees colliding generated commands fall back to source-prefixed names automatically
- [x] **SAFE-04**: User receives a warning when collision fallback changes a generated command name

### Schema and Documentation

- [ ] **CONF-01**: User can discover the new top-level and per-source configuration fields through the published JSON Schema
- [ ] **CONF-02**: User can learn the new configuration behavior from `README.md`
- [ ] **CONF-03**: User can learn precedence, examples, and fallback behavior from `docs/configuration.md`

### Regression Coverage

- [ ] **TEST-01**: Maintainer can verify default behavior remains unchanged through automated tests
- [ ] **TEST-02**: Maintainer can verify global disable and per-source override behavior through automated tests
- [ ] **TEST-03**: Maintainer can verify custom source prefix values through automated tests
- [ ] **TEST-04**: Maintainer can verify collision fallback and warning behavior through automated tests

## v2 Requirements

### Naming Flexibility

- **NAME-01**: User can configure naming delimiters other than `:`
- **NAME-02**: User can define one global custom prefix string shared across all sources
- **NAME-03**: User can choose custom collision-resolution strategies other than source-prefix fallback

## Out of Scope

| Feature | Reason |
|---------|--------|
| Arbitrary command naming templates | Too much flexibility for this milestone; increases ambiguity and collision surface |
| Source-specific execution or prompt changes tied to naming | This milestone only changes generated command names |
| Breaking default generated names | Existing users rely on current prefixes and should not need migration |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PFX-01 | Phase 1 | Complete |
| PFX-02 | Phase 1 | Complete |
| PFX-03 | Phase 1 | Complete |
| PFX-04 | Phase 1 | Complete |
| SAFE-01 | Phase 1 | Complete |
| SAFE-02 | Phase 2 | Complete |
| SAFE-03 | Phase 2 | Complete |
| SAFE-04 | Phase 2 | Complete |
| CONF-01 | Phase 3 | Pending |
| CONF-02 | Phase 3 | Pending |
| CONF-03 | Phase 3 | Pending |
| TEST-01 | Phase 3 | Pending |
| TEST-02 | Phase 3 | Pending |
| TEST-03 | Phase 3 | Pending |
| TEST-04 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-03-26 after roadmap creation*
