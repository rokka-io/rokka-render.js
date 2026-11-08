# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.11.0] - unreleased

### Added

- Add typedoc-based API documentation generation (`npm run docs`)
- Add comprehensive API reference with parameter tables, types, and examples to README

### Changed

- **BREAKING**: Require Node.js >= 18 (dropped support for Node 10-16)
- Upgrade TypeScript target from ES5 to ES2020
- Upgrade dev dependencies: TypeScript 5.9, Jest 29, Rollup 4, ts-jest 29
- Replace `rollup-plugin-terser` with `@rollup/plugin-terser`
- CI now tests on Node 18, 20, 22
- Use `StackOperation[]` type instead of `object` for stack parameters in `getUrl` and `getUrlFromUrl`

### Fixed

- Operation options with value `false` or `0` were rendered as `__undefined__` in dynamic stack URLs

## [0.10.2]

- Add more special characters to match for query parameter placement

## [0.10.1]

- Bugfixes

## [0.10.0]

- Export Variables interface
- Add addStackVariables function

## [0.9.0]

- Initial release
