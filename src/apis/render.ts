import {
  stringifyBool,
  stringifyOperations,
  stringifyStackOptions,
} from '../utils'
import { StackOperation, StackOptions } from './stacks'

/**
 * Key-value pairs for stack variables used in dynamic image rendering.
 *
 * Variables are injected into the URL and can be referenced in stack operations
 * using expressions (e.g., `$width`).
 *
 * @example
 * const variables: Variables = {
 *   width: 300,
 *   quality: 'high',
 *   grayscale: true
 * }
 */
export interface Variables {
  [key: string]: string | number | boolean
}

export type AddStackVariablesType = (
  url: string,
  variables: Variables,
  removeSafeUrlFromQuery?: boolean,
) => string

interface UrlComponents {
  stack: string
  hash: string
  filename?: string
  format: string
}

export type GetUrlComponentsType = (urlObject: URL) => UrlComponents | false

type WithRequiredProperty<Type, Key extends keyof Type> = Type & {
  [Property in Key]-?: Type[Property]
}

/**
 * Options for the {@link getUrlFromUrl} function.
 */
export interface GetUrlFromUrlOptions {
  /** Stack-level options (e.g., autoformat). Adds `o-{options}` to the URL path. */
  stackoptions?: StackOptions
  /** Override or set the filename in the URL. Useful for SEO. */
  filename?: string
  /** Override the output format (e.g., 'webp', 'png', 'jpg'). */
  format?: string
  /** Variables to add or merge into the URL. */
  variables?: Variables
  /** If true, use decoded characters in query params for more readable URLs. Default: false. */
  removeSafeUrlFromQuery?: boolean
  /** If true, remove existing variables from the URL before adding new ones. Default: true. */
  clearVariables?: boolean
}

/**
 * Options for the {@link getUrl} function.
 */
export interface GetUrlOptions {
  /** Set a filename in the URL. Useful for SEO and descriptive downloads. */
  filename?: string
  /** Stack-level options (e.g., autoformat). Adds `o-{options}` to the URL path. */
  stackoptions?: StackOptions
  /** Variables to add to the URL. */
  variables?: Variables
  /** If true, use decoded characters in query params for more readable URLs. Default: false. */
  removeSafeUrlFromQuery?: boolean
}

interface StackComponents {
  variables: Variables
  stackString: string
}

// currently only gets stack variables
const getStackComponents = (stack: string): StackComponents => {
  // split by slashes
  // TODO: if we parse operations and options, only the stuff before the first / is a dynamic operation
  // otherwise it's just new options for that operation
  // but we don't parse operations yet, here.

  const slashSplits = stack.split('/')
  const variables: Variables = {}

  for (let i = 0; i < slashSplits.length; i++) {
    const slashSplit = slashSplits[i]
    // then by --, both are valid seperators here
    const dashSplits = slashSplit.split('--')
    for (let j = 0; j < dashSplits.length; j++) {
      const dashSplit = dashSplits[j]
      // and get the object for the variables (or other "parts", later)
      const [operationName, ...options] = dashSplit.split('-')
      if (operationName === 'v' || operationName === 'variables') {
        let name = ''
        // we have a match, set it to empty
        dashSplits[j] = ''
        for (let k = 0; k < options.length; k++) {
          if (k % 2 === 0) {
            name = options[k]
          } else {
            variables[name] = options[k]
          }
        }
      }
    }
    // put them back together
    slashSplits[i] = dashSplits.filter(dashSplit => dashSplit !== '').join('--')
  }
  const stackString = slashSplits
    .filter(slashSplit => slashSplit !== '')
    .join('/')

  return { variables, stackString }
}

const getUrlComponents: GetUrlComponentsType = (urlObject: URL) => {
  const stackPattern = '(?<stack>.*([^-]|--)|-*)'
  const hashPattern = '(?<hash>[0-9a-f]{6,40})'
  const filenamePattern = '(?<filename>[^\\/^.]+)'
  const formatPattern = '(?<format>.{2,4})'
  const pathPattern = '(?<hash>-.+-)'

  const regExes = [
    new RegExp(
      `/${stackPattern}/${hashPattern}/${filenamePattern}\.${formatPattern}`,
    ),
    new RegExp(`/${stackPattern}/${hashPattern}\.${formatPattern}`),
    new RegExp(
      `/${stackPattern}/${pathPattern}/${filenamePattern}\.${formatPattern}`,
    ),

    new RegExp(`/${stackPattern}/${pathPattern}\.${formatPattern}`),
  ]

  const path = urlObject.pathname
  let matches = null
  for (let i = 0; i < regExes.length; i++) {
    matches = path.match(regExes[i])
    if (matches) {
      break
    }
  }

  if (matches !== null && matches.groups?.['stack']) {
    return {
      stack: matches.groups['stack'],
      hash: matches.groups['hash'],
      format: matches.groups['format'],
      filename: matches.groups['filename'],
    }
  }
  return false
}

export const getStackVariables = (
  urlComponents: UrlComponents,
  urlObject: URL,
  stackComponents: StackComponents,
  variables: Variables,
) => {
  const variablesFromPath = stackComponents.variables
  const vQuery = urlObject.searchParams.get('v')
  const vQueryParsed: Variables = vQuery !== null ? JSON.parse(vQuery) : {}

  return Object.assign(variablesFromPath, vQueryParsed, variables)
}

/**
 * Generate a rokka render URL from individual components.
 *
 * @param organization - The rokka organization name
 * @param hash - The image hash (6-40 hex characters) or source path
 * @param format - The output format (e.g., 'jpg', 'png', 'webp')
 * @param stack - Stack name (string) or array of {@link StackOperation} objects for dynamic stacks
 * @param options - Optional settings for filename, stack options, and variables
 * @param renderHost - Custom render host. Default: `https://{organization}.rokka.io`
 * @returns The complete rokka render URL
 *
 * @example
 * // Using a named stack
 * getUrl('myorg', 'abc123', 'jpg', 'thumbnail')
 * // => 'https://myorg.rokka.io/thumbnail/abc123.jpg'
 *
 * @example
 * // Using dynamic operations
 * getUrl('myorg', 'abc123', 'png', [
 *   { name: 'resize', options: { width: 300 } },
 *   { name: 'crop', options: { width: 200, height: 200 } }
 * ])
 * // => 'https://myorg.rokka.io/dynamic/resize-width-300--crop-width-200-height-200/abc123.png'
 *
 * @example
 * // With filename and variables
 * getUrl('myorg', 'abc123', 'jpg', 'gallery', {
 *   filename: 'my-image',
 *   variables: { size: 'large' }
 * })
 * // => 'https://myorg.rokka.io/gallery/v-size-large/abc123/my-image.jpg'
 */
export const getUrl = (
  organization: string,
  hash: string,
  format: string,
  stack: string | StackOperation[],
  options?: GetUrlOptions,
  renderHost = 'https://{organization}.rokka.io',
) => {
  const host = renderHost.replace('{organization}', organization)
  const mixedParam = Array.isArray(stack)
    ? `dynamic/${stringifyOperations(stack)}` // array of operations
    : stack // stack name
  let stackString = mixedParam || 'dynamic/noop'

  if (options?.stackoptions) {
    const stackoptions = stringifyStackOptions(options?.stackoptions)
    if (stackoptions) {
      stackString = `${stackString}/o-${stackoptions}`
    }
  }

  if (options?.filename) {
    hash = `${hash}/${options.filename}`
  }

  const url = `${host}/${stackString}/${hash}.${format}`
  if (options?.variables && Object.keys(options.variables).length > 0) {
    return addStackVariables(
      url,
      options.variables,
      options.removeSafeUrlFromQuery || false,
    )
  }
  return url
}

/**
 * Transform an existing rokka render URL with a new stack and options.
 *
 * Extracts the organization, hash, and other components from the input URL,
 * then generates a new URL with the specified stack and options.
 *
 * @param rokkaUrl - An existing rokka render URL
 * @param stack - Stack name (string) or array of {@link StackOperation} objects
 * @param options - Optional settings to modify the URL
 * @param renderHost - Custom render host. Default: `https://{organization}.rokka.io`
 * @returns The transformed rokka render URL, or the original URL if parsing fails
 *
 * @example
 * // Change to a different stack
 * getUrlFromUrl(
 *   'https://myorg.rokka.io/dynamic/abc123.png',
 *   'thumbnail'
 * )
 * // => 'https://myorg.rokka.io/thumbnail/abc123.png'
 *
 * @example
 * // Change format and add filename
 * getUrlFromUrl(
 *   'https://myorg.rokka.io/gallery/abc123.png',
 *   'large',
 *   { format: 'webp', filename: 'photo' }
 * )
 * // => 'https://myorg.rokka.io/large/abc123/photo.webp'
 *
 * @example
 * // Use dynamic operations and preserve existing variables
 * getUrlFromUrl(
 *   'https://myorg.rokka.io/stack/v-color-red/abc123.jpg',
 *   [{ name: 'resize', options: { width: 400 } }],
 *   { clearVariables: false, variables: { size: 'medium' } }
 * )
 * // Variables 'color' and 'size' are both preserved in the output
 */
export const getUrlFromUrl = (
  rokkaUrl: string,
  stack: string | StackOperation[],
  options: GetUrlFromUrlOptions = {},
  renderHost = 'https://{organization}.rokka.io',
): string => {
  const url = new URL(rokkaUrl)

  const components = getUrlComponents(url)
  if (!components) {
    return rokkaUrl
  }

  const resolvedOptions: WithRequiredProperty<
    GetUrlFromUrlOptions,
    | 'stackoptions'
    | 'format'
    | 'removeSafeUrlFromQuery'
    | 'clearVariables'
    | 'variables'
  > = {
    stackoptions: {},
    filename: components.filename,
    format: components.format,
    removeSafeUrlFromQuery: false,
    clearVariables: true,
    variables: {},
    ...options,
  }
  let variables = resolvedOptions.variables
  if (!resolvedOptions.clearVariables) {
    const stackComponents = getStackComponents(components.stack)
    variables = getStackVariables(
      components,
      url,
      stackComponents,
      resolvedOptions.variables,
    )
  }

  const renderHostUrl = new URL(renderHost)

  const replaceHost = decodeURIComponent(renderHostUrl.host).replace(
    '{organization}',
    '',
  )
  return getUrl(
    url.hostname.replace(replaceHost, ''),
    components.hash,
    resolvedOptions.format,
    stack,
    {
      filename: resolvedOptions.filename,
      stackoptions: resolvedOptions.stackoptions,
      variables: variables,
      removeSafeUrlFromQuery: resolvedOptions.removeSafeUrlFromQuery,
    },
    renderHost,
  )
}

/**
 * Add or update stack variables in a rokka render URL.
 *
 * Variables are merged with any existing variables in the URL. The placement
 * of variables depends on their content:
 * - Short values (<=20 chars) without special characters go in the URL path as `v-name-value`
 * - Longer values or those with special characters go in the `?v={...}` query parameter
 *
 * Special characters that trigger query parameter placement: `* $ / \ - # % & ? ; : ` (space)
 *
 * @param url - A rokka render URL
 * @param variables - Variables to add or update
 * @param removeSafeUrlFromQuery - If true, decode URL-safe characters for more readable query params. Default: false
 * @returns The URL with variables added/updated, or the original URL if parsing fails
 *
 * @example
 * // Add simple variables (goes in URL path)
 * addStackVariables(
 *   'https://myorg.rokka.io/stack/abc123.jpg',
 *   { color: 'red', size: 100 }
 * )
 * // => 'https://myorg.rokka.io/stack/v-color-red-size-100/abc123.jpg'
 *
 * @example
 * // Variables with special characters go in query param
 * addStackVariables(
 *   'https://myorg.rokka.io/stack/abc123.jpg',
 *   { text: 'Hello World!' }
 * )
 * // => 'https://myorg.rokka.io/stack/abc123.jpg?v={"text":"Hello World!"}'
 *
 * @example
 * // Merge with existing variables
 * addStackVariables(
 *   'https://myorg.rokka.io/stack/v-a-1/abc123.jpg',
 *   { b: 2 }
 * )
 * // => 'https://myorg.rokka.io/stack/v-a-1-b-2/abc123.jpg'
 */
export const addStackVariables: AddStackVariablesType = (
  url,
  variables,
  removeSafeUrlFromQuery = false,
): string => {
  const urlObject = new URL(url)

  const urlComponents = getUrlComponents(urlObject)

  if (!urlComponents) {
    return url
  }

  const stackComponents = getStackComponents(urlComponents.stack)

  const returnVariables = getStackVariables(
    urlComponents,
    urlObject,
    stackComponents,
    variables,
  )

  // put variables into url string or v parameter, depending on characters in it
  if (Object.keys(returnVariables).length > 0) {
    const jsonVariables: Variables = {}
    let urlVariables = ''
    for (const name in returnVariables) {
      const value = returnVariables[name]
      if (value || value === false) {
        const valueAsString = value.toString()
        // if there's a special var in the value, put it into the v query parameter
        if (
          valueAsString.length > 20 ||
          valueAsString.match(/[*$/\\\-#%&?; :]/)
        ) {
          jsonVariables[name] = stringifyBool(value)
        } else {
          urlVariables += '-' + name + '-' + stringifyBool(value)
        }
      }
    }
    if (urlVariables !== '') {
      stackComponents.stackString += '/v' + urlVariables
    }
    if (Object.keys(jsonVariables).length > 0) {
      urlObject.searchParams.set('v', JSON.stringify(jsonVariables))
    } else {
      urlObject.searchParams.delete('v')
    }
  }

  urlObject.pathname =
    stackComponents.stackString +
    '/' +
    urlComponents.hash +
    (urlComponents.filename ? '/' + urlComponents.filename : '') +
    '.' +
    urlComponents.format

  // remove url safe characters on demand for "nicer" urls in demos and such
  if (removeSafeUrlFromQuery) {
    const query = urlObject.search
    urlObject.search = ''

    return (
      urlObject.toString() +
      query
        .replace(/%22/g, '"')
        .replace(/%20/g, ' ')
        .replace(/%2C/g, ',')
        .replace(/%7B/g, '{')
        .replace(/%7D/g, '}')
        .replace(/%3A/g, ':')
    )
  }

  return urlObject.toString()
}
