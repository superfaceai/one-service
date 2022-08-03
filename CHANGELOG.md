# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
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

[Unreleased]: https://github.com/superfaceai/one-service/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/superfaceai/one-service/compare/v1.0.0-rc.3...v1.0.0
[1.0.0-rc.3]: https://github.com/superfaceai/one-service/compare/v1.0.0-rc.2...v1.0.0-rc.3
[1.0.0-rc.2]: https://github.com/superfaceai/one-service/compare/v1.0.0-rc.1...v1.0.0-rc.2
[1.0.0-rc.1]: https://github.com/superfaceai/one-service/compare/v1.0.0-rc.0...v1.0.0-rc.1
