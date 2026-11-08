# apis/render

## Interfaces

### GetUrlFromUrlOptions

Options for the [getUrlFromUrl](#geturlfromurl) function.

#### Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-clearvariables"></a> `clearVariables?` | `boolean` | If true, remove existing variables from the URL before adding new ones. Default: true. |
| <a id="property-filename"></a> `filename?` | `string` | Override or set the filename in the URL. Useful for SEO. |
| <a id="property-format"></a> `format?` | `string` | Override the output format (e.g., 'webp', 'png', 'jpg'). |
| <a id="property-removesafeurlfromquery"></a> `removeSafeUrlFromQuery?` | `boolean` | If true, use decoded characters in query params for more readable URLs. Default: false. |
| <a id="property-stackoptions"></a> `stackoptions?` | [`StackOptions`](stacks.md#stackoptions) | Stack-level options (e.g., autoformat). Adds `o-{options}` to the URL path. |
| <a id="property-variables"></a> `variables?` | [`Variables`](#variables) | Variables to add or merge into the URL. |

***

### GetUrlOptions

Options for the [getUrl](#geturl) function.

#### Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-filename-1"></a> `filename?` | `string` | Set a filename in the URL. Useful for SEO and descriptive downloads. |
| <a id="property-removesafeurlfromquery-1"></a> `removeSafeUrlFromQuery?` | `boolean` | If true, use decoded characters in query params for more readable URLs. Default: false. |
| <a id="property-stackoptions-1"></a> `stackoptions?` | [`StackOptions`](stacks.md#stackoptions) | Stack-level options (e.g., autoformat). Adds `o-{options}` to the URL path. |
| <a id="property-variables-1"></a> `variables?` | [`Variables`](#variables) | Variables to add to the URL. |

***

### Variables

Key-value pairs for stack variables used in dynamic image rendering.

Variables are injected into the URL and can be referenced in stack operations
using expressions (e.g., `$width`).

#### Example

```ts
const variables: Variables = {
  width: 300,
  quality: 'high',
  grayscale: true
}
```

#### Indexable

```ts
[key: string]: string | number | boolean
```

## Type Aliases

### AddStackVariablesType

```ts
type AddStackVariablesType = (url, variables, removeSafeUrlFromQuery?) => string;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | `string` |
| `variables` | [`Variables`](#variables) |
| `removeSafeUrlFromQuery?` | `boolean` |

#### Returns

`string`

***

### GetUrlComponentsType

```ts
type GetUrlComponentsType = (urlObject) => UrlComponents | false;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `urlObject` | `URL` |

#### Returns

`UrlComponents` \| `false`

## Variables

### addStackVariables

```ts
const addStackVariables: AddStackVariablesType;
```

Add or update stack variables in a rokka render URL.

Variables are merged with any existing variables in the URL. The placement
of variables depends on their content:
- Short values (<=20 chars) without special characters go in the URL path as `v-name-value`
- Longer values or those with special characters go in the `?v={...}` query parameter

Special characters that trigger query parameter placement: `* $ / \ - # % & ? ; : ` (space)

#### Param

**url**

A rokka render URL

#### Param

**variables**

Variables to add or update

#### Param

**removeSafeUrlFromQuery**

If true, decode URL-safe characters for more readable query params. Default: false

#### Returns

The URL with variables added/updated, or the original URL if parsing fails

#### Examples

```ts
// Add simple variables (goes in URL path)
addStackVariables(
  'https://myorg.rokka.io/stack/abc123.jpg',
  { color: 'red', size: 100 }
)
// => 'https://myorg.rokka.io/stack/v-color-red-size-100/abc123.jpg'
```

```ts
// Variables with special characters go in query param
addStackVariables(
  'https://myorg.rokka.io/stack/abc123.jpg',
  { text: 'Hello World!' }
)
// => 'https://myorg.rokka.io/stack/abc123.jpg?v={"text":"Hello World!"}'
```

```ts
// Merge with existing variables
addStackVariables(
  'https://myorg.rokka.io/stack/v-a-1/abc123.jpg',
  { b: 2 }
)
// => 'https://myorg.rokka.io/stack/v-a-1-b-2/abc123.jpg'
```

## Functions

### getStackVariables()

```ts
function getStackVariables(
   urlComponents, 
   urlObject, 
   stackComponents, 
   variables
): Variables;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `urlComponents` | `UrlComponents` |
| `urlObject` | `URL` |
| `stackComponents` | `StackComponents` |
| `variables` | [`Variables`](#variables) |

#### Returns

[`Variables`](#variables)

***

### getUrl()

```ts
function getUrl(
   organization, 
   hash, 
   format, 
   stack, 
   options?, 
   renderHost?
): string;
```

Generate a rokka render URL from individual components.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `organization` | `string` | `undefined` | The rokka organization name |
| `hash` | `string` | `undefined` | The image hash (6-40 hex characters) or source path |
| `format` | `string` | `undefined` | The output format (e.g., 'jpg', 'png', 'webp') |
| `stack` | `string` \| [`StackOperation`](stacks.md#stackoperation)[] | `undefined` | Stack name (string) or array of [StackOperation](stacks.md#stackoperation) objects for dynamic stacks |
| `options?` | [`GetUrlOptions`](#geturloptions) | `undefined` | Optional settings for filename, stack options, and variables |
| `renderHost?` | `string` | `'https://{organization}.rokka.io'` | Custom render host. Default: `https://{organization}.rokka.io` |

#### Returns

`string`

The complete rokka render URL

#### Examples

```ts
// Using a named stack
getUrl('myorg', 'abc123', 'jpg', 'thumbnail')
// => 'https://myorg.rokka.io/thumbnail/abc123.jpg'
```

```ts
// Using dynamic operations
getUrl('myorg', 'abc123', 'png', [
  { name: 'resize', options: { width: 300 } },
  { name: 'crop', options: { width: 200, height: 200 } }
])
// => 'https://myorg.rokka.io/dynamic/resize-width-300--crop-width-200-height-200/abc123.png'
```

```ts
// With filename and variables
getUrl('myorg', 'abc123', 'jpg', 'gallery', {
  filename: 'my-image',
  variables: { size: 'large' }
})
// => 'https://myorg.rokka.io/gallery/v-size-large/abc123/my-image.jpg'
```

***

### getUrlFromUrl()

```ts
function getUrlFromUrl(
   rokkaUrl, 
   stack, 
   options?, 
   renderHost?
): string;
```

Transform an existing rokka render URL with a new stack and options.

Extracts the organization, hash, and other components from the input URL,
then generates a new URL with the specified stack and options.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `rokkaUrl` | `string` | `undefined` | An existing rokka render URL |
| `stack` | `string` \| [`StackOperation`](stacks.md#stackoperation)[] | `undefined` | Stack name (string) or array of [StackOperation](stacks.md#stackoperation) objects |
| `options?` | [`GetUrlFromUrlOptions`](#geturlfromurloptions) | `{}` | Optional settings to modify the URL |
| `renderHost?` | `string` | `'https://{organization}.rokka.io'` | Custom render host. Default: `https://{organization}.rokka.io` |

#### Returns

`string`

The transformed rokka render URL, or the original URL if parsing fails

#### Examples

```ts
// Change to a different stack
getUrlFromUrl(
  'https://myorg.rokka.io/dynamic/abc123.png',
  'thumbnail'
)
// => 'https://myorg.rokka.io/thumbnail/abc123.png'
```

```ts
// Change format and add filename
getUrlFromUrl(
  'https://myorg.rokka.io/gallery/abc123.png',
  'large',
  { format: 'webp', filename: 'photo' }
)
// => 'https://myorg.rokka.io/large/abc123/photo.webp'
```

```ts
// Use dynamic operations and preserve existing variables
getUrlFromUrl(
  'https://myorg.rokka.io/stack/v-color-red/abc123.jpg',
  [{ name: 'resize', options: { width: 400 } }],
  { clearVariables: false, variables: { size: 'medium' } }
)
// Variables 'color' and 'size' are both preserved in the output
```
