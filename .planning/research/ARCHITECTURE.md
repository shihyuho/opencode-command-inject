# Architecture Patterns

**Domain:** OpenCode command-injection plugin naming configurability
**Researched:** 2026-03-26

## Recommended Architecture

Add a **dedicated command-naming layer** between source adapters and runtime hook injection. Do **not** let source adapters keep owning final slash-command names. Today each adapter emits hard-coded names like `make:build`, `pnpm:dev`, and `skill:review`; that works for fixed naming, but it couples discovery to naming and makes configurable prefix behavior awkward to reason about and harder to test.

Recommended pipeline:

```text
Config loader
  -> naming policy resolver
  -> source adapters load raw commands
  -> command collector preserves source order
  -> naming planner computes preferred names
  -> collision resolver applies fallback-to-canonical-prefix rules
  -> hook injector publishes final commands + execution catalog
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `src/config/*` | Parse merged config and expose typed naming settings | Plugin orchestration, naming policy resolver |
| `createCommandInjectHooks()` | Orchestrate startup, instantiate sources, call collector + naming planner, build final catalog | Config layer, source adapters, naming planner, OpenCode hooks |
| Source adapters (`makefile`, `npm-scripts`, `skill`) | Discover commands and emit **raw command metadata**, not final user-facing names | Filesystem, naming planner input |
| `collectCommandSources()` / refactored aggregator | Load all adapters concurrently and preserve source order | Source adapters, naming planner |
| `naming-policy.ts` | Convert global + per-source config into effective naming rules per source | Config layer, naming planner |
| `name-resolver.ts` | Build preferred and canonical fallback names for a single command | Naming policy, raw command metadata |
| `collision-resolver.ts` | Detect collisions across dynamic commands and existing commands; promote colliding commands to canonical prefixed names; warn only if collision still remains | Name resolver, hook injector |
| Hook injection/catalog layer | Inject final command definitions into `config.command`, track injected names, map command name -> template for `command.execute.before` | OpenCode plugin hooks |

### Recommended Data Shapes

Keep the boundary explicit with two types:

```typescript
interface DiscoveredCommand {
  sourceId: "makefile" | "npm-scripts" | "skill"
  localName: string
  canonicalPrefix: string
  description: string
  template: string
}

interface ResolvedCommand {
  name: string
  sourceId: string
  localName: string
  description: string
  template: string
  resolution: "preferred" | "fallback-canonical-prefix"
}
```

The important design decision is that **`DiscoveredCommand.localName` is the stable identity**, while **`ResolvedCommand.name` is presentation/runtime routing output**.

### Data Flow

1. `loadPluginConfig()` returns merged config.
2. `createCommandInjectHooks()` instantiates enabled adapters.
3. Each adapter loads project data and returns `DiscoveredCommand[]` with:
   - `sourceId`
   - `localName` (`build`, `dev`, `review`)
   - `canonicalPrefix` (`make`, detected runner like `pnpm`, or `skill`)
   - existing `description` and `template`
4. The collector flattens all discovered commands **without cross-source name dedupe**.
5. `naming-policy.ts` resolves effective policy from config:
   - top-level `command_name_prefix`: global on/off only
   - `sources.<source>.command_name_prefix.value`: source-owned custom prefix override
6. `name-resolver.ts` computes for each command:
   - **preferred name**: based on effective policy
   - **canonical fallback name**: always `<canonicalPrefix>:<localName>`
7. `collision-resolver.ts` runs in two passes:
   - Pass 1: assign preferred names
   - Pass 2: for any dynamic/dynamic or dynamic/existing conflict, reassign affected dynamic commands to canonical fallback names
   - If a command still collides after fallback, keep current first-wins warning behavior
8. Hook injector publishes only `ResolvedCommand.name` values into `config.command` and uses the same final names in the execution catalog for `command.execute.before`.

Direction is strictly one-way:

```text
config -> policy -> discovered commands -> resolved names -> injected config/runtime catalog
```

No source adapter should need to know whether another source caused a collision.

## Patterns to Follow

### Pattern 1: Separate discovery from naming
**What:** Adapters discover commands; a dedicated service names them later.
**When:** Always. This feature specifically needs naming to vary independently of source parsing.
**Example:**
```typescript
const discovered = await collectCommandSources(dynamicSources, context)
const policy = createNamingPolicy(options.config)
const resolved = resolveCommandNames(discovered, policy, existingNames, logger)
```

### Pattern 2: Two-pass collision resolution
**What:** First try preferred names, then selectively promote colliding commands to canonical prefixed names.
**When:** Whenever prefix removal or custom prefixes can create ambiguity.
**Example:**
```typescript
const initial = discovered.map((cmd) => ({
  command: cmd,
  preferredName: buildPreferredName(cmd, policy),
  fallbackName: `${cmd.canonicalPrefix}:${cmd.localName}`,
}))

const resolved = applyFallbackForCollisions(initial, existingNames)
```

### Pattern 3: Policy object, not inline conditionals
**What:** Centralize enable/disable/custom-prefix decisions in one typed policy model.
**When:** Before name resolution.
**Example:**
```typescript
interface SourceNamingPolicy {
  mode: "prefixed" | "unprefixed"
  customPrefix?: string
}
```

### Pattern 4: Keep runtime hooks dumb
**What:** `config` and `command.execute.before` should consume already-resolved commands, not recompute naming.
**When:** Always. Startup decides names once.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Naming logic inside each source adapter
**What:** Extending `MakefileCommandSource`, `NpmScriptsCommandSource`, and `SkillCommandSource` with separate prefix toggles and collision logic.
**Why bad:** Duplicates rules three times, makes cross-source collisions impossible to handle cleanly, and couples config semantics to parser code.
**Instead:** Emit raw metadata and centralize naming.

### Anti-Pattern 2: Keep name-based dedupe in the current aggregator
**What:** Continuing to drop duplicates in `aggregateCommandSources()` based on `command.name` before configurable naming is resolved.
**Why bad:** The aggregator would be deduping on unstable intermediate names.
**Instead:** Move cross-source collision handling after final/preferred names are computed.

### Anti-Pattern 3: Let top-level config own source-specific prefix text
**What:** Putting custom strings like `make`, `pnpm`, `skill` under one global naming namespace.
**Why bad:** Conflicts with the approved config direction and makes per-source ownership blurry.
**Instead:** Keep global config as on/off only; source config owns custom prefix value.

### Anti-Pattern 4: Recompute names at execute time
**What:** Deriving names again in `command.execute.before`.
**Why bad:** Risks drift from injected config and makes behavior harder to test.
**Instead:** Build one startup catalog keyed by final resolved name.

## Suggested Build Order

1. **Introduce naming config types and schema**
   - Add top-level `command_name_prefix`
   - Add `sources.<source>.command_name_prefix.value`
   - Dependency: none

2. **Refactor adapter outputs to raw command metadata**
   - Remove hard requirement that adapters emit final slash-command names
   - Dependency: type updates from step 1 are optional; can happen in parallel if types are additive

3. **Implement naming policy + resolver modules with unit tests**
   - Pure functions first
   - Cover preferred naming, custom prefix, global disable, and canonical fallback
   - Dependency: step 2

4. **Replace aggregator name-dedupe with post-resolution collision handling**
   - Integrate resolver into `createCommandInjectHooks()`
   - Dependency: step 3

5. **Update hook integration tests**
   - Verify injected command names and execution routing both use resolved names
   - Verify dynamic-vs-existing conflict behavior
   - Dependency: step 4

6. **Update docs and regenerate JSON schema**
   - `README.md`, `docs/configuration.md`, `opencode-command-inject.schema.json`
   - Dependency: steps 1 and 4

### Dependency Notes

- The key dependency is **raw command identity before final naming**. Without that, fallback behavior becomes brittle.
- Collision handling must run **before** `config.command` injection, otherwise existing-command conflicts are discovered too late.
- Existing first-wins behavior can remain as the terminal safety net, but it should become the **last** stage, not the primary naming strategy.

## Testable Component Design

Prefer pure functions for naming decisions:

| Unit | What to Test |
|------|--------------|
| `createNamingPolicy()` | config merge semantics, default behavior, source override precedence |
| `buildPreferredName()` | prefixed vs unprefixed vs custom prefix output |
| `resolveCommandNames()` | two-pass fallback on dynamic/dynamic and dynamic/existing collisions |
| adapter `load()` methods | raw command extraction only |
| `createCommandInjectHooks()` | end-to-end injection uses resolved names and preserves execution templates |

Recommended fixture cases:

- `make:build` + `pnpm:build` with global prefix disable -> both collide -> both fall back to canonical prefixes
- `skill:review` with custom source prefix `agent` -> `/agent:review`
- existing config already contains `build` -> dynamic unprefixed `build` falls back to `make:build`
- same-source duplicate skill names still handled inside source-level normalization/dedupe

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| Startup complexity | Negligible; pure in-memory resolution | Still negligible; work is per-project startup | Still acceptable; plugin remains local and project-scoped |
| Test surface | A few unit + integration tests | Important to keep naming pure and isolated | Critical; avoid hook-time branching explosions |
| Source growth | Three sources easy to manage | More sources favor centralized naming policy | Mandatory to avoid per-source naming drift |
| Collision behavior | Rare but visible | More configs mean more edge cases | Requires explicit, deterministic resolver rules |

## Sources

- Repository architecture and current boundaries: `src/plugin.ts`, `src/plugin/command-inject.ts`, `src/command-sources/aggregator.ts`, `src/command-sources/*.ts` — HIGH confidence
- Project requirements and constraints: `.planning/PROJECT.md`, `.planning/codebase/ARCHITECTURE.md` — HIGH confidence
- OpenCode plugin hook model: OpenCode Plugins docs via Context7 (`/websites/opencode_ai_plugins`, https://opencode.ai/docs/plugins/index) — HIGH confidence
