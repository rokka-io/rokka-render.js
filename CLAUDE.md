# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**rokka-render** is a lightweight TypeScript library for generating [Rokka](https://rokka.io) image render URLs. It's a browser-optimized subset of the full `rokka.js` library, focused on URL construction with zero runtime dependencies.

## Commands

- **Run all checks (lint + tests):** `npm test`
- **Run tests only:** `npm run jest`
- **Run a single test file:** `npx jest tests/apis/render.test.ts`
- **Lint:** `npm run lint`
- **Lint with autofix:** `npm run lint:fix`
- **Build dist (UMD, ESM, CJS):** `npm run compile`
- **Watch mode:** `npm run watch`

## Architecture

The library exports pure functions — no classes, no state. All source is in `src/`.

- **`src/index.ts`** — Re-exports everything from `apis/render` and `apis/stacks`
- **`src/apis/render.ts`** — Core logic: `getUrl()`, `getUrlFromUrl()`, `addStackVariables()`. Uses regex-based URL parsing with 4 patterns to handle different rokka URL formats. Smart variable encoding places clean values in the URL path (`v-name-value`) and values with special characters in query params (`?v={...}`)
- **`src/apis/stacks.ts`** — TypeScript interfaces: `StackOperation`, `StackOptions`, `Variables`, `GetUrlOptions`, `GetUrlFromUrlOptions`
- **`src/utils.ts`** — Serialization helpers: `stringifyOperations()`, `stringifyStackOptions()`, `stringifyBool()`

## Build Output

Rollup produces three formats in `dist/`:
- `dist/index.js` — CommonJS
- `dist/index.esm.js` — ES modules
- `dist/index.umd.min.js` — UMD (minified, for CDN/browser)

## Tests

Tests live in `tests/apis/` mirroring the source structure. Jest with ts-jest. The `render.addStackVariables.test.ts` file uses parameterized `it.each()` test cases.
