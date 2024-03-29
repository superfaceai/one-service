# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.3] - 2023-04-14
### Fixed
- Map empty objects in result and input to custom types with noop field (`EmptyObject`, `EmptyInputObject`) - [#52](https://github.com/superfaceai/one-service/pull/52)

## [3.0.2] - 2023-04-05
### Fixed
- Fix mapping Comlink `number` primitive type to GraphQL `Float` - [#51](https://github.com/superfaceai/one-service/pull/51)

## [3.0.1] - 2023-04-03
### Fixed
- Fix Provider Configuration GraphQL type name collision - [#47](https://github.com/superfaceai/one-service/pull/47)
- Fix loading security and parameters from `super.json` - [#48](https://github.com/superfaceai/one-service/pull/48)
- Sanitize security ids for GQL schema and desanitized for OneSDK - [#49](https://github.com/superfaceai/one-service/pull/49)

## [3.0.0] - 2023-03-30
### Added
- **BREAKING** Added UseCase arguemnt `provider` to allow provider specific configuration and avoid collisions between them [#41](https://github.com/superfaceai/one-service/pull/41) [#45](https://github.com/superfaceai/one-service/pull/45) [#46](https://github.com/superfaceai/one-service/pull/46)

### Fixed
- Handle use-cases without result defined - [#43](https://github.com/superfaceai/one-service/pull/43)
- Configurable parameters are now taken from provider definition instead of super.json's providers section - [#41](https://github.com/superfaceai/one-service/pull/41), [#45](https://github.com/superfaceai/one-service/pull/45)

## [2.2.3] - 2023-03-24
### Fixed
- generate schema when use case contains empty input fields without input argument - [#42](https://github.com/superfaceai/one-service/pull/42)

## [2.2.2] - 2023-03-09
### Fixed
- generate _superJson introspection schema and resolver with SuperJson document from argument instead of loading it from file system - [#38](https://github.com/superfaceai/one-service/pull/38)

## [2.2.1] - 2023-03-07
### Fixed
- CLI port option validation with custom validation function Issue [#35](https://github.com/superfaceai/one-service/issues/35) - [#37](https://github.com/superfaceai/one-service/pull/37)

## [2.2.0] - 2023-03-06
### Added
- `createGraphQLMiddleware` accepts context agument with `getOneSdkInstance` to allow own OneSDK instances - [#32](https://github.com/superfaceai/one-service/pull/32)
- option to log requests and OneSDK perform results as structured log using [Pino](https://github.com/pinojs/pino) - [#33](https://github.com/superfaceai/one-service/pull/33)

### Fixed
- Pin GraphiQL to specific version (v2.4.0) to prevent breakage due to incorrect integrity check - [#34](https://github.com/superfaceai/one-service/pull/34)

## [2.1.0] - 2023-02-16
### Changed
- Replaced `express-graphql` with `graphql-http` - [#31](https://github.com/superfaceai/one-service/pull/31)
- Moved GraphiQL from `/graphql` to root `/` - [#31](https://github.com/superfaceai/one-service/pull/31)

## [2.0.4] - 2023-02-16
### Changed
- Update OneSDK to v2.3.1 - [#30](https://github.com/superfaceai/one-service/pull/30)

## [2.0.3] - 2023-02-15
### Fixed
- Handle not specified input in GQL query - [#29](https://github.com/superfaceai/one-service/pull/29)

## [2.0.2] - 2023-02-08

## [2.0.1] - 2023-01-16
### Changed
- use OneSDK 2.2

## [2.0.0] - 2022-08-29
### Changed
- Use OneSDK 2.0
- Use OneSDK logic to resolve Profile AST
- Replaced SuperJson class with `NormalizedSuperJsonDocument` structure

### Removed
- Removed Registry module

## [1.1.0] - 2022-08-04
### Changed
- Return correctly structured error from the resolver (#24)

## [1.0.0] - 2022-06-16
### Changed
- Updated and pin OneSDK to 1.5.1

### Removed
- Removed explicit dependency on AST and Parser

## [1.0.0-rc.3] - 2022-05-31
### Added
- Graceful shutdown

### Changed
- Updated @superfaceai/ast, @superfaceai/parser and @superfaceai/one-sdk
- Removed @superfaceai/cli dependency and reimplemented prifile loading
- Fixed enum names

## [1.0.0-rc.2] - 2022-02-08
### Added
- Support for provider parameters in use-case options (#10)

## [1.0.0-rc.1] - 2022-01-11

## 1.0.0-rc.0 - 2022-01-11

[Unreleased]: https://github.com/superfaceai/one-service/compare/v3.0.3...HEAD
[3.0.3]: https://github.com/superfaceai/one-service/compare/v3.0.2...v3.0.3
[3.0.2]: https://github.com/superfaceai/one-service/compare/v3.0.1...v3.0.2
[3.0.1]: https://github.com/superfaceai/one-service/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/superfaceai/one-service/compare/v2.2.3...v3.0.0
[2.2.3]: https://github.com/superfaceai/one-service/compare/v2.2.2...v2.2.3
[2.2.2]: https://github.com/superfaceai/one-service/compare/v2.2.1...v2.2.2
[2.2.1]: https://github.com/superfaceai/one-service/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/superfaceai/one-service/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/superfaceai/one-service/compare/v2.0.4...v2.1.0
[2.0.4]: https://github.com/superfaceai/one-service/compare/v2.0.3...v2.0.4
[2.0.3]: https://github.com/superfaceai/one-service/compare/v2.0.2...v2.0.3
[2.0.2]: https://github.com/superfaceai/one-service/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/superfaceai/one-service/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/superfaceai/one-service/compare/v1.1.0...v2.0.0
[1.1.0]: https://github.com/superfaceai/one-service/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/superfaceai/one-service/compare/v1.0.0-rc.3...v1.0.0
[1.0.0-rc.3]: https://github.com/superfaceai/one-service/compare/v1.0.0-rc.2...v1.0.0-rc.3
[1.0.0-rc.2]: https://github.com/superfaceai/one-service/compare/v1.0.0-rc.1...v1.0.0-rc.2
[1.0.0-rc.1]: https://github.com/superfaceai/one-service/compare/v1.0.0-rc.0...v1.0.0-rc.1
