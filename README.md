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

<!-- DOCS -->

See [full API documentation](docs/api/) for detailed reference.

## API Reference

### getUrl(organization, hash, format, stack, options?, renderHost?)

Generate a rokka render URL from individual components.

**Parameters:**

| Name           | Type                         | Description                                                               |
| -------------- | ---------------------------- | ------------------------------------------------------------------------- |
| `organization` | `string`                     | The rokka organization name                                               |
| `hash`         | `string`                     | The image hash (6-40 hex characters) or source path                       |
| `format`       | `string`                     | The output format (e.g., 'jpg', 'png', 'webp')                            |
| `stack`        | `string \| StackOperation[]` | Stack name (string) or array of StackOperation objects for dynamic stacks |
| `options`      | `GetUrlOptions`              | Optional settings for filename, stack options, and variables              |
| `renderHost`   | `string`                     | Custom render host. Default: `https://{organization}.rokka.io`            |

**Returns:** `string` - The complete rokka render URL

**Examples:**

```js
// Using a named stack
getUrl('myorg', 'abc123', 'jpg', 'thumbnail')
// => 'https://myorg.rokka.io/thumbnail/abc123.jpg'
```

```js
// Using dynamic operations
getUrl('myorg', 'abc123', 'png', [
  { name: 'resize', options: { width: 300 } },
  { name: 'crop', options: { width: 200, height: 200 } }
])
// => 'https://myorg.rokka.io/dynamic/resize-width-300--crop-width-200-height-200/abc123.png'
```

```js
// With filename and variables
getUrl('myorg', 'abc123', 'jpg', 'gallery', {
  filename: 'my-image',
  variables: { size: 'large' }
})
// => 'https://myorg.rokka.io/gallery/v-size-large/abc123/my-image.jpg'
```

---

### getUrlFromUrl(rokkaUrl, stack, options?, renderHost?)

Transform an existing rokka render URL with a new stack and options.

Extracts the organization, hash, and other components from the input URL, then generates a new URL with the specified stack and options.

**Parameters:**

| Name         | Type                         | Description                                                    |
| ------------ | ---------------------------- | -------------------------------------------------------------- |
| `rokkaUrl`   | `string`                     | An existing rokka render URL                                   |
| `stack`      | `string \| StackOperation[]` | Stack name (string) or array of StackOperation objects         |
| `options`    | `GetUrlFromUrlOptions`       | Optional settings to modify the URL Default: `{}`              |
| `renderHost` | `string`                     | Custom render host. Default: `https://{organization}.rokka.io` |

**Returns:** `string` - The transformed rokka render URL, or the original URL if parsing fails

**Examples:**

```js
// Change to a different stack
getUrlFromUrl(
  'https://myorg.rokka.io/dynamic/abc123.png',
  'thumbnail'
)
// => 'https://myorg.rokka.io/thumbnail/abc123.png'
```

```js
// Change format and add filename
getUrlFromUrl(
  'https://myorg.rokka.io/gallery/abc123.png',
  'large',
  { format: 'webp', filename: 'photo' }
)
// => 'https://myorg.rokka.io/large/abc123/photo.webp'
```

```js
// Use dynamic operations and preserve existing variables
getUrlFromUrl(
  'https://myorg.rokka.io/stack/v-color-red/abc123.jpg',
  [{ name: 'resize', options: { width: 400 } }],
  { clearVariables: false, variables: { size: 'medium' } }
)
// Variables 'color' and 'size' are both preserved in the output
```

---

### addStackVariables(url, variables, removeSafeUrlFromQuery?)

Add or update stack variables in a rokka render URL.

Variables are merged with any existing variables in the URL. The placement of variables depends on their content: - Short values (<=20 chars) without special characters go in the URL path as `v-name-value` - Longer values or those with special characters go in the `?v={...}` query parameter

Special characters that trigger query parameter placement: `* $ / \ - # % & ? ; : ` (space)

**Parameters:**

| Name                     | Type        | Description                                                                        |
| ------------------------ | ----------- | ---------------------------------------------------------------------------------- |
| `url`                    | `string`    | A rokka render URL                                                                 |
| `variables`              | `Variables` | Variables to add or update                                                         |
| `removeSafeUrlFromQuery` | `boolean`   | If true, decode URL-safe characters for more readable query params. Default: false |

**Returns:** `string` - The URL with variables added/updated, or the original URL if parsing fails

**Examples:**

```js
// Add simple variables (goes in URL path)
addStackVariables(
  'https://myorg.rokka.io/stack/abc123.jpg',
  { color: 'red', size: 100 }
)
// => 'https://myorg.rokka.io/stack/v-color-red-size-100/abc123.jpg'
```

```js
// Variables with special characters go in query param
addStackVariables(
  'https://myorg.rokka.io/stack/abc123.jpg',
  { text: 'Hello World!' }
)
// => 'https://myorg.rokka.io/stack/abc123.jpg?v={"text":"Hello World!"}'
```

```js
// Merge with existing variables
addStackVariables(
  'https://myorg.rokka.io/stack/v-a-1/abc123.jpg',
  { b: 2 }
)
// => 'https://myorg.rokka.io/stack/v-a-1-b-2/abc123.jpg'
```

---

## Types

### StackOperation

Defines a single image operation for dynamic stacks.

```ts
interface StackOperation {
  // The operation name (e.g., 'resize', 'crop', 'blur')
  name: string
  // Key-value pairs for operation parameters
  options?: {
    [key: string]: string | number | boolean | undefined | null
  }
  // Key-value pairs for dynamic expressions using stack variables
  expressions?: {
    [key: string]: string | number | boolean | undefined | null
  }
}
```

**Example:**

```js
// Resize operation
const resize: StackOperation = {
  name: 'resize',
  options: { width: 300, height: 200 }
}
```

```js
// Crop with expressions
const crop: StackOperation = {
  name: 'crop',
  options: { width: 100, height: 100 },
  expressions: { anchor_x: '$anchor_x' }
}
```

### StackOptions

Stack-level options that modify rendering behavior.

Common options include: - `af` (autoformat): Automatically select the best image format - `optim` (optimization): Image optimization settings

```ts
interface StackOptions {
  [key: string]: string | number | boolean
}
```

**Example:**

```js
const options: StackOptions = {
  af: 1,      // Enable autoformat
  optim: 80   // Set optimization level
}
```

### Variables

Key-value pairs for stack variables used in dynamic image rendering.

Variables are injected into the URL and can be referenced in stack operations using expressions (e.g., `$width`).

```ts
interface Variables {
  [key: string]: string | number | boolean
}
```

**Example:**

```js
const variables: Variables = {
  width: 300,
  quality: 'high',
  grayscale: true
}
```

### GetUrlFromUrlOptions

Options for the `getUrlFromUrl` function.

```ts
interface GetUrlFromUrlOptions {
  // Stack-level options (e.g., autoformat). Adds `o-{options}` to the URL path.
  stackoptions?: StackOptions
  // Override or set the filename in the URL. Useful for SEO.
  filename?: string
  // Override the output format (e.g., 'webp', 'png', 'jpg').
  format?: string
  // Variables to add or merge into the URL.
  variables?: Variables
  // If true, use decoded characters in query params for more readable URLs. Default: false.
  removeSafeUrlFromQuery?: boolean
  // If true, remove existing variables from the URL before adding new ones. Default: true.
  clearVariables?: boolean
}
```

### GetUrlOptions

Options for the `getUrl` function.

```ts
interface GetUrlOptions {
  // Set a filename in the URL. Useful for SEO and descriptive downloads.
  filename?: string
  // Stack-level options (e.g., autoformat). Adds `o-{options}` to the URL path.
  stackoptions?: StackOptions
  // Variables to add to the URL.
  variables?: Variables
  // If true, use decoded characters in query params for more readable URLs. Default: false.
  removeSafeUrlFromQuery?: boolean
}
```

<!-- ENDDOCS -->

## See Also

- [rokka.io](https://rokka.io/) - The image processing service
- [rokka.js](https://github.com/rokka-io/rokka.js) - Full-featured JavaScript client
- [Rokka API Documentation](https://rokka.io/documentation/)

[npm-url]: https://npmjs.com/package/rokka-render
[npm-version-image]: https://img.shields.io/npm/v/rokka-render.svg?style=flat-square

[build-status-url]: https://github.com/rokka-io/rokka-render.js/actions/workflows/main.yml
[build-status-image]: https://github.com/rokka-io/rokka-render.js/actions/workflows/main.yml/badge.svg
