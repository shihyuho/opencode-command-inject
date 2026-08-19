# Changelog

## [1.3.1](https://github.com/shihyuho/opencode-command-inject/compare/v1.3.0...v1.3.1) (2026-08-19)


### Bug Fixes

* collapse split Makefile target declarations ([#26](https://github.com/shihyuho/opencode-command-inject/issues/26)) ([4c4ba4c](https://github.com/shihyuho/opencode-command-inject/commit/4c4ba4c7645ae92addb6c02cf41c90b73e77391d))

## [1.3.0](https://github.com/shihyuho/opencode-command-inject/compare/v1.2.1...v1.3.0) (2026-03-30)


### Features

* support OPENCODE_CONFIG_DIR for plugin config directory ([#20](https://github.com/shihyuho/opencode-command-inject/issues/20)) ([886bf76](https://github.com/shihyuho/opencode-command-inject/commit/886bf7650bf327690a05e1bb9d4ac55b2db06c8c))

## [1.2.1](https://github.com/shihyuho/opencode-command-inject/compare/v1.2.0...v1.2.1) (2026-03-27)


### Bug Fixes

* clarify default naming docs ([2473928](https://github.com/shihyuho/opencode-command-inject/commit/2473928cd33b0e27ed63525feaa695939a1e1843))

## [1.2.0](https://github.com/shihyuho/opencode-command-inject/compare/v1.1.0...v1.2.0) (2026-03-18)


### Features

* add namespace mapping and symlink support for skill discovery ([#12](https://github.com/shihyuho/opencode-command-inject/issues/12)) ([9c4cf36](https://github.com/shihyuho/opencode-command-inject/commit/9c4cf36bdd94f0ae831b266ef41d1c9eabc9283f))

## [1.1.0](https://github.com/shihyuho/opencode-command-inject/compare/v1.0.0...v1.1.0) (2026-03-17)


### Features

* rename enabled to disable for source configuration ([#10](https://github.com/shihyuho/opencode-command-inject/issues/10)) ([125dcb9](https://github.com/shihyuho/opencode-command-inject/commit/125dcb99c56d0b1b0db0422b961aff077c32e179))

## [1.0.0](https://github.com/shihyuho/opencode-command-inject/compare/v0.2.0...v1.0.0) (2026-03-17)


### ⚠ BREAKING CHANGES

* initial stable release with finalized plugin API

### Features

* Add configuration file support for command-sources ([#8](https://github.com/shihyuho/opencode-command-inject/issues/8)) ([8e22f56](https://github.com/shihyuho/opencode-command-inject/commit/8e22f5628a26b88e207a1d1b611c6da9d981f755))
* stabilize API for v1.0.0 release ([1cd8250](https://github.com/shihyuho/opencode-command-inject/commit/1cd82509534c83f675485e6cb5491c10705975bf))


### Bug Fixes

* add component to release-please config ([077bacc](https://github.com/shihyuho/opencode-command-inject/commit/077baccde2e16249d24e0bf1998d759b527111e4))
* add release-as to force v1.0.0 release PR ([61729ca](https://github.com/shihyuho/opencode-command-inject/commit/61729ca3019b447116e9d5694d6baf4226ee85e7))
* remove component, use simple vx.x.x tags ([720e6a7](https://github.com/shihyuho/opencode-command-inject/commit/720e6a79bdb677ae892d4d548fabe670314f918c))


### Reverts

* set version to 0.2.0 for release-please baseline ([9f6a8f7](https://github.com/shihyuho/opencode-command-inject/commit/9f6a8f735a0ded051002e9e4431ee08496973b22))

## [0.2.0](https://github.com/shihyuho/opencode-command-inject/compare/opencode-command-inject-v0.1.0...opencode-command-inject-v0.2.0) (2026-03-16)


### Features

* add dependabot.yml ([105d006](https://github.com/shihyuho/opencode-command-inject/commit/105d00618961885396b029ff3ca0c2e782b648a2))
* detect and use project's configured package manager for running scripts ([2c2cf63](https://github.com/shihyuho/opencode-command-inject/commit/2c2cf633080c4f4dff2ed90e875a5cabe40fbfdc))
* discover skills as commands ([#2](https://github.com/shihyuho/opencode-command-inject/issues/2)) ([61ee5f8](https://github.com/shihyuho/opencode-command-inject/commit/61ee5f8a4478aca7dc44a5f61b507e140c1be2dd))
* inject loaded skills as commands ([#1](https://github.com/shihyuho/opencode-command-inject/issues/1)) ([92b723d](https://github.com/shihyuho/opencode-command-inject/commit/92b723d3ebc1b8866dfab66d47fffa20d303c542))
* inject Makefile targets and npm scripts as discoverable slash commands ([89ee1c1](https://github.com/shihyuho/opencode-command-inject/commit/89ee1c105729808783f237ac40ef254ccb33dfbe))
* support pnpm, yarn, and bun runners for package scripts ([e8bbe1f](https://github.com/shihyuho/opencode-command-inject/commit/e8bbe1f9dda8615b76fbc9b01418907d144edc05))
* update packages.json for publish ([991f06e](https://github.com/shihyuho/opencode-command-inject/commit/991f06e4fdc1f7834855d1a04a7b8d5d93762785))


### Bug Fixes

* add release-please manifest and fix workflow ([3a5d1a5](https://github.com/shihyuho/opencode-command-inject/commit/3a5d1a54fbfecdb0fc7f0fa6f96a6b8221f4794c))
* log duplicate discovered skills at debug level ([#3](https://github.com/shihyuho/opencode-command-inject/issues/3)) ([bd33580](https://github.com/shihyuho/opencode-command-inject/commit/bd33580e1bdb8c1982a77cfb0e5b4b6631d83c8e))
* only export Plugin function from index.ts ([e1037b4](https://github.com/shihyuho/opencode-command-inject/commit/e1037b49a05704f9eed9e60179be90750e66956b))
* show descriptions for Makefile targets with dependencies ([10a48b5](https://github.com/shihyuho/opencode-command-inject/commit/10a48b59bbf6374fdc07e7978aa59301ea0905df))
