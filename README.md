# rokka-render.js [![NPM version][npm-version-image]][npm-url] [![Build Status][build-status-image]][build-status-url]

Lightweight JavaScript client for generating [rokka](https://rokka.io/) image render URLs.

This is a minimal subset of [rokka.js](https://github.com/rokka-io/rokka.js), designed for browser environments where bundle size matters. It provides only the URL generation functions, not the full rokka API client.

Runs on Node.js (>=10) and in [all modern browsers](http://browserl.ist/?q=%3E0.1%25%2C+not+op_mini+all).

## Install

```bash
npm install rokka-render
```

## Quick Start

```js
import { getUrl, getUrlFromUrl, addStackVariables } from 'rokka-render'

// Generate a URL from components
const url = getUrl('myorg', 'abc123', 'jpg', 'thumbnail')
// => 'https://myorg.rokka.io/thumbnail/abc123.jpg'

// Transform an existing rokka URL
const newUrl = getUrlFromUrl(
  'https://myorg.rokka.io/dynamic/abc123.png',
  'gallery'
)
// => 'https://myorg.rokka.io/gallery/abc123.png'

// Add variables to a URL
const urlWithVars = addStackVariables(
  'https://myorg.rokka.io/stack/abc123.jpg',
  { width: 300, quality: 'high' }
)
// => 'https://myorg.rokka.io/stack/v-width-300-quality-high/abc123.jpg'
```

## API Reference

### getUrl(organization, hash, format, stack, options?, renderHost?)

Generate a rokka render URL from individual components.

**Parameters:**

| Name           | Type                         | Description                                                          |
| -------------- | ---------------------------- | -------------------------------------------------------------------- |
| `organization` | `string`                     | The rokka organization name                                          |
| `hash`         | `string`                     | The image hash (6-40 hex characters)                                 |
| `format`       | `string`                     | Output format (`'jpg'`, `'png'`, `'webp'`, etc.)                     |
| `stack`        | `string \| StackOperation[]` | Stack name or array of operations                                    |
| `options`      | `GetUrlOptions`              | Optional settings (see below)                                        |
| `renderHost`   | `string`                     | Custom render host. Default: `'https://{organization}.rokka.io'`     |

**Returns:** `string` - The complete rokka render URL

**Examples:**

```js
// Using a named stack
getUrl('myorg', 'abc123', 'jpg', 'thumbnail')
// => 'https://myorg.rokka.io/thumbnail/abc123.jpg'

// Using dynamic operations
getUrl('myorg', 'abc123', 'png', [
  { name: 'resize', options: { width: 300 } },
  { name: 'crop', options: { width: 200, height: 200 } }
])
// => 'https://myorg.rokka.io/dynamic/resize-width-300--crop-width-200-height-200/abc123.png'

// With filename (for SEO-friendly URLs)
getUrl('myorg', 'abc123', 'jpg', 'gallery', { filename: 'my-photo' })
// => 'https://myorg.rokka.io/gallery/abc123/my-photo.jpg'

// With stack options and variables
getUrl('myorg', 'abc123', 'jpg', 'responsive', {
  stackoptions: { af: 1 },
  variables: { width: 800 }
})
```

---

### getUrlFromUrl(rokkaUrl, stack, options?, renderHost?)

Transform an existing rokka render URL with a new stack and options.

**Parameters:**

| Name         | Type                         | Description                                                      |
| ------------ | ---------------------------- | ---------------------------------------------------------------- |
| `rokkaUrl`   | `string`                     | An existing rokka render URL                                     |
| `stack`      | `string \| StackOperation[]` | Stack name or array of operations                                |
| `options`    | `GetUrlFromUrlOptions`       | Optional settings (see below)                                    |
| `renderHost` | `string`                     | Custom render host. Default: `'https://{organization}.rokka.io'` |

**Returns:** `string` - The transformed URL, or the original URL if parsing fails

**Examples:**

```js
// Change to a different stack
getUrlFromUrl('https://myorg.rokka.io/dynamic/abc123.png', 'thumbnail')
// => 'https://myorg.rokka.io/thumbnail/abc123.png'

// Change format and add filename
getUrlFromUrl(
  'https://myorg.rokka.io/gallery/abc123.png',
  'large',
  { format: 'webp', filename: 'photo' }
)
// => 'https://myorg.rokka.io/large/abc123/photo.webp'

// Preserve existing variables when adding new ones
getUrlFromUrl(
  'https://myorg.rokka.io/stack/v-color-red/abc123.jpg',
  'newstack',
  { clearVariables: false, variables: { size: 'medium' } }
)
// Both 'color' and 'size' variables are preserved
```

---

### addStackVariables(url, variables, removeSafeUrlFromQuery?)

Add or update stack variables in a rokka render URL.

Variables are merged with any existing variables. The placement depends on the value:

- Short values (<=20 chars) without special characters → URL path as `v-name-value`
- Longer values or those with special characters → `?v={...}` query parameter

Special characters that trigger query parameter: `* $ / \ - # % & ? ; :` and space

**Parameters:**

| Name                     | Type        | Description                                                       |
| ------------------------ | ----------- | ----------------------------------------------------------------- |
| `url`                    | `string`    | A rokka render URL                                                |
| `variables`              | `Variables` | Variables to add or update                                        |
| `removeSafeUrlFromQuery` | `boolean`   | Decode URL-safe chars for readable query params. Default: `false` |

**Returns:** `string` - The URL with variables, or original URL if parsing fails

**Examples:**

```js
// Simple variables go in URL path
addStackVariables(
  'https://myorg.rokka.io/stack/abc123.jpg',
  { color: 'red', size: 100 }
)
// => 'https://myorg.rokka.io/stack/v-color-red-size-100/abc123.jpg'

// Variables with special characters go in query param
addStackVariables(
  'https://myorg.rokka.io/stack/abc123.jpg',
  { text: 'Hello World!' }
)
// => 'https://myorg.rokka.io/stack/abc123.jpg?v={"text":"Hello World!"}'

// Merge with existing variables
addStackVariables(
  'https://myorg.rokka.io/stack/v-a-1/abc123.jpg',
  { b: 2 }
)
// => 'https://myorg.rokka.io/stack/v-a-1-b-2/abc123.jpg'
```

---

## Types

### Variables

Key-value pairs for stack variables.

```ts
interface Variables {
  [key: string]: string | number | boolean
}
```

### StackOperation

Defines an image operation for dynamic stacks.

```ts
interface StackOperation {
  name: string       // Operation name (e.g., 'resize', 'crop')
  options?: {        // Operation parameters
    [key: string]: string | number | boolean | undefined | null
  }
  expressions?: {    // Dynamic expressions using stack variables
    [key: string]: string | number | boolean | undefined | null
  }
}
```

**Example:**

```js
const operations = [
  { name: 'resize', options: { width: 300, height: 200 } },
  { name: 'crop', options: { width: 100 }, expressions: { anchor_x: '$anchor' } }
]
```

### StackOptions

Stack-level options that modify rendering behavior.

```ts
interface StackOptions {
  [key: string]: string | number | boolean
}
```

Common options:

- `af` - Autoformat: automatically select the best image format
- `optim` - Optimization level

### GetUrlOptions

Options for `getUrl()`.

```ts
interface GetUrlOptions {
  filename?: string           // Set filename in URL (for SEO)
  stackoptions?: StackOptions // Stack-level options
  variables?: Variables       // Variables to add
  removeSafeUrlFromQuery?: boolean // Decode query params. Default: false
}
```

### GetUrlFromUrlOptions

Options for `getUrlFromUrl()`.

```ts
interface GetUrlFromUrlOptions {
  filename?: string           // Override filename
  format?: string             // Override output format
  stackoptions?: StackOptions // Stack-level options
  variables?: Variables       // Variables to add/merge
  clearVariables?: boolean    // Remove existing variables. Default: true
  removeSafeUrlFromQuery?: boolean // Decode query params. Default: false
}
```

## See Also

- [rokka.io](https://rokka.io/) - The image processing service
- [rokka.js](https://github.com/rokka-io/rokka.js) - Full-featured JavaScript client
- [Rokka API Documentation](https://rokka.io/documentation/)

[npm-url]: https://npmjs.com/package/rokka-render
[npm-version-image]: https://img.shields.io/npm/v/rokka-render.svg?style=flat-square

[build-status-url]: https://github.com/rokka-io/rokka-render.js/actions/workflows/main.yml
[build-status-image]: https://github.com/rokka-io/rokka-render.js/actions/workflows/main.yml/badge.svg
