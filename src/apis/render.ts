import {
  stringifyBool,
  stringifyOperations,
  stringifyStackOptions,
} from '../utils'
import { StackOptions } from './stacks'

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

export interface GetUrlFromUrlOptions {
  stackoptions?: StackOptions
  filename?: string
  format?: string
  variables?: Variables
  removeSafeUrlFromQuery?: boolean
  clearVariables?: boolean
}

export interface GetUrlOptions {
  filename?: string
  stackoptions?: StackOptions
  variables?: Variables
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
 * ### Render
 *
 * @module render
 */
export const getUrl = (
  organization: string,
  hash: string,
  format: string,
  stack: string | object,
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
 * Get URL for rendering an image from a rokka render URL.
 *
 * ```js
 * rokka.render.getUrl('https://myorg.rokka.io/dynamic/c421f4e8cefe0fd3aab22832f51e85bacda0a47a.png', 'mystack')
 * ```
 *
 * @param  {string}                      rokkaUrl    rokka render URL
 * @param  {string|array}                stack       stack name or an array of stack operation objects
 * @param  {{filename:string|undefined, stackoptions: StackOptions|undefined, format: string|undefined, variables: Variables|undefined, clearVariables:boolean|undefined, removeSafeUrlFromQuery: boolean|undefined}} options     Optional. filename: Adds or changes the filename to the URL, stackoptions: Adds stackoptions to the URL, format: Changes the format
 * @return {string}
 */
export const getUrlFromUrl = (
  rokkaUrl: string,
  stack: string | object,
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
