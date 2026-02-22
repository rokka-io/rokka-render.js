import { Application } from 'typedoc'
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  rmSync,
} from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const readme = join(__dirname, '../README.md')
const apiDocsDir = join(__dirname, 'api')
const srcDir = join(__dirname, '../src/apis')

async function generate() {
  // Clean up previous docs
  if (existsSync(apiDocsDir)) {
    rmSync(apiDocsDir, { recursive: true, force: true })
  }
  mkdirSync(apiDocsDir, { recursive: true })

  // Bootstrap TypeDoc with the markdown plugin
  const app = await Application.bootstrapWithPlugins({
    entryPoints: [
      join(__dirname, '../src/index.ts'),
      join(__dirname, '../src/apis/render.ts'),
      join(__dirname, '../src/apis/stacks.ts'),
      join(__dirname, '../src/utils.ts'),
    ],
    tsconfig: join(__dirname, '../tsconfig.json'),
    plugin: ['typedoc-plugin-markdown'],
    out: apiDocsDir,
    readme: 'none',
    excludePrivate: true,
    excludeInternal: true,
    excludeExternals: true,
    disableSources: true,
    hideGenerator: true,
    githubPages: false,
    // Markdown plugin options
    router: 'module',
    hideBreadcrumbs: true,
    hidePageHeader: true,
    hidePageTitle: false,
    useCodeBlocks: true,
    parametersFormat: 'table',
    interfacePropertiesFormat: 'table',
    classPropertiesFormat: 'table',
    enumMembersFormat: 'table',
    typeDeclarationFormat: 'table',
  })

  // Convert TypeScript to project model
  const project = await app.convert()

  if (!project) {
    console.error('Failed to convert project')
    process.exit(1)
  }

  // Generate markdown files to docs/api/
  await app.generateOutputs(project)

  // Build README summary by parsing source files directly
  let summaryContent =
    '\nSee [full API documentation](docs/api/) for detailed reference.\n\n'

  // Extract functions from render.ts
  const renderPath = join(srcDir, 'render.ts')
  const renderContent = readFileSync(renderPath, 'utf8')
  const methods = extractMethodsFromSource(renderContent)

  summaryContent += '## API Reference\n\n'
  for (const method of methods) {
    summaryContent += method
  }

  // Extract types from both files
  const stacksPath = join(srcDir, 'stacks.ts')
  const stacksContent = readFileSync(stacksPath, 'utf8')
  const types = extractTypes(renderContent, stacksContent)
  if (types) {
    summaryContent += '## Types\n\n'
    summaryContent += types
  }

  // Insert summary into README
  let readmeStr = readFileSync(readme, 'utf8')
  readmeStr = readmeStr.replace(
    /(<!-- DOCS -->)[\s\S]+(<!-- ENDDOCS -->)/,
    '$1\n' + summaryContent + '$2'
  )

  writeFileSync(readme, readmeStr)

  console.log('Documentation generated.')
}

/**
 * Extract full parameter info from @param tags including descriptions
 */
function extractParamDetails(jsdocBlock) {
  const params = []
  // Match @param name - description (no {type} in our JSDoc)
  const paramPattern = /@param\s+(\w+)\s+-\s+(.+)/g
  let match
  while ((match = paramPattern.exec(jsdocBlock)) !== null) {
    params.push({ name: match[1], description: match[2].trim() })
  }
  return params
}

/**
 * Extract parameter types from the TypeScript function signature
 */
function extractParamTypes(signatureStr) {
  const types = {}
  // Split by comma, but respect nested generics/objects
  const params = splitParams(signatureStr)
  for (const param of params) {
    const trimmed = param.trim()
    // Match: name?: Type or name: Type or name: Type = default or name = default
    const match = trimmed.match(/^(\w+)\??\s*(?::\s*(.+?))?(?:\s*=\s*(.+))?$/)
    if (match) {
      const name = match[1]
      let type = match[2] || ''
      const defaultVal = match[3]?.trim()
      // Clean up type - remove trailing default value if it leaked in
      type = type.replace(/\s*=\s*.*$/, '').trim()
      // If no explicit type but has a default value, infer type from default
      if (!type && defaultVal) {
        if (defaultVal.startsWith("'") || defaultVal.startsWith('"')) {
          type = 'string'
        } else if (defaultVal === 'true' || defaultVal === 'false') {
          type = 'boolean'
        } else if (!isNaN(Number(defaultVal))) {
          type = 'number'
        }
      }
      if (type || defaultVal) {
        types[name] = { type, default: defaultVal }
      }
    }
  }
  return types
}

/**
 * Split function parameters respecting nested brackets
 */
function splitParams(str) {
  const result = []
  let depth = 0
  let current = ''
  for (const ch of str) {
    if (ch === '(' || ch === '<' || ch === '{' || ch === '[') depth++
    if (ch === ')' || ch === '>' || ch === '}' || ch === ']') depth--
    if (ch === ',' && depth === 0) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim()) result.push(current)
  return result
}

/**
 * Extract @returns description
 */
function extractReturns(jsdocBlock) {
  const match = jsdocBlock.match(/@returns?\s+(.+)/)
  return match ? match[1].trim() : null
}

/**
 * Format a type string for display, making it more readable
 */
function formatType(typeStr) {
  if (!typeStr) return ''
  // Replace 'object' with 'StackOperation[]' for stack param
  return typeStr
    .replace(/\s*\|\s*/g, ' \\| ')
}

/**
 * Parse TypeScript source file to extract function documentation
 */
function extractMethodsFromSource(fileContent) {
  const methods = []
  const allFuncs = []

  const jsdocPattern = /\/\*\*[\s\S]*?\*\//g
  let match

  while ((match = jsdocPattern.exec(fileContent)) !== null) {
    const jsdocBlock = match[0]
    const afterJsdoc = fileContent.slice(match.index + jsdocBlock.length)

    // Match: export const funcName = ( or export const funcName: TypeName = (
    const funcMatch = afterJsdoc.match(
      /^\s*export\s+const\s+(\w+)\s*(?::\s*\w+\s*)?=\s*\(/
    )
    if (!funcMatch) continue

    const funcName = funcMatch[1]

    // Find the opening paren position
    const parenPos = match.index + jsdocBlock.length + funcMatch[0].length
    const paramsStr = extractBalancedParens(fileContent, parenPos)

    allFuncs.push({ name: funcName, jsdoc: jsdocBlock, paramsStr })
  }

  for (const func of allFuncs) {
    const paramDetails = extractParamDetails(func.jsdoc)
    let paramTypes = extractParamTypes(func.paramsStr)

    // If most params have no types (typed via type alias), try to resolve from type alias
    const typedCount = Object.values(paramTypes).filter(v => v.type).length
    const paramCount = paramDetails.length
    if (typedCount < paramCount / 2) {
      // Look for type annotation: export const name: TypeName = (
      const typeAliasMatch = fileContent.match(
        new RegExp('export\\s+const\\s+' + func.name + '\\s*:\\s*(\\w+)\\s*=')
      )
      if (typeAliasMatch) {
        const aliasName = typeAliasMatch[1]
        // Find the type alias definition
        const aliasMatch = fileContent.match(
          new RegExp('(?:export\\s+)?type\\s+' + aliasName + '\\s*=\\s*\\(([\\s\\S]*?)\\)\\s*=>')
        )
        if (aliasMatch) {
          paramTypes = extractParamTypes(aliasMatch[1])
        }
      }
    }
    const returns = extractReturns(func.jsdoc)

    // Build header
    const paramNames = paramDetails.map(p => {
      const typeInfo = paramTypes[p.name]
      const isOptional = typeInfo?.default !== undefined ||
        func.paramsStr.includes(p.name + '?') ||
        func.paramsStr.match(new RegExp(p.name + '\\s*(?::\\s*[^,=]+)?\\s*='))
      return isOptional ? p.name + '?' : p.name
    })
    let entry = `### ${func.name}(${paramNames.join(', ')})\n\n`

    // Description
    const descMatch = func.jsdoc.match(/\/\*\*\s*\n?\s*\*?\s*([\s\S]*?)(?=\s*\*\s*@[a-z]|\s*\*\/)/m)
    if (descMatch) {
      const desc = descMatch[1]
        .split('\n')
        .map(line => line.replace(/^\s*\*\s?/, ''))
        .join('\n')
        .replace(/\n\s*\n/g, '\n\n')
        .replace(/(?<!\n)\n(?!\n)/g, ' ')
        .replace(/  +/g, ' ')
        .replace(/\{@link\s+(\w+)\}/g, '$1')
        .trim()
      if (desc) {
        entry += desc + '\n\n'
      }
    }

    // Parameter table
    if (paramDetails.length > 0) {
      entry += '**Parameters:**\n\n'

      // Build rows first to calculate column widths
      const rows = paramDetails.map(param => {
        const typeInfo = paramTypes[param.name]
        const type = typeInfo ? formatType(typeInfo.type) : ''
        let desc = param.description.replace(/\{@link\s+(\w+)\}/g, '$1')
        if (typeInfo?.default && !desc.includes('Default:')) {
          desc += ` Default: \`${typeInfo.default}\``
        }
        return { name: '`' + param.name + '`', type: '`' + type + '`', desc }
      })

      const headers = { name: 'Name', type: 'Type', desc: 'Description' }
      const colWidths = {
        name: Math.max(headers.name.length, ...rows.map(r => r.name.length)),
        type: Math.max(headers.type.length, ...rows.map(r => r.type.length)),
        desc: Math.max(headers.desc.length, ...rows.map(r => r.desc.length)),
      }

      const pad = (s, w) => s + ' '.repeat(Math.max(0, w - s.length))
      const sep = (w) => '-'.repeat(w)

      entry += `| ${pad(headers.name, colWidths.name)} | ${pad(headers.type, colWidths.type)} | ${pad(headers.desc, colWidths.desc)} |\n`
      entry += `| ${sep(colWidths.name)} | ${sep(colWidths.type)} | ${sep(colWidths.desc)} |\n`
      for (const row of rows) {
        entry += `| ${pad(row.name, colWidths.name)} | ${pad(row.type, colWidths.type)} | ${pad(row.desc, colWidths.desc)} |\n`
      }
      entry += '\n'
    }

    // Returns
    if (returns) {
      entry += `**Returns:** \`string\` - ${returns}\n\n`
    }

    // Examples
    const examples = extractExamples(func.jsdoc)
    if (examples.length > 0) {
      entry += '**Examples:**\n\n'
      for (const example of examples) {
        entry += '```js\n' + example + '\n```\n\n'
      }
    }

    entry += '---\n\n'
    methods.push(entry)
  }

  return methods
}

/**
 * Extract balanced parentheses content from a position
 */
function extractBalancedParens(content, startPos) {
  let depth = 0
  let result = ''
  for (let i = startPos; i < content.length; i++) {
    const ch = content[i]
    if (ch === '(') {
      depth++
      if (depth === 1) continue // skip the opening paren we're starting from
    }
    if (ch === ')') {
      if (depth <= 1) break
      depth--
    }
    result += ch
  }
  return result
}

/**
 * Extract @example blocks from JSDoc
 */
function extractExamples(jsdocBlock) {
  const examples = []
  const examplePattern = /\*\s*@example\s*\n([\s\S]*?)(?=\s*\*\s*@example|\s*\*\s*@param|\s*\*\s*@returns?|\s*\*\/)/g
  let match
  while ((match = examplePattern.exec(jsdocBlock)) !== null) {
    const code = match[1]
      .split('\n')
      .map(line => line.replace(/^\s*\*\s?/, ''))
      .join('\n')
      .trim()
    if (code) {
      examples.push(code)
    }
  }
  return examples
}

/**
 * Extract exported interface documentation
 */
function extractTypes(renderContent, stacksContent) {
  let output = ''
  const allContent = stacksContent + '\n' + renderContent

  // Find all exported interfaces with their JSDoc
  const interfacePattern = /(\/\*\*[\s\S]*?\*\/\s*)?export\s+interface\s+(\w+)\s*\{([\s\S]*?)\n\}/g
  let match

  while ((match = interfacePattern.exec(allContent)) !== null) {
    const jsdoc = match[1] || ''
    const name = match[2]
    const body = match[3]

    // Skip internal types
    if (name === 'UrlComponents' || name === 'StackComponents') continue

    output += `### ${name}\n\n`

    // Extract description from JSDoc
    const descMatch = jsdoc.match(/\/\*\*\s*\n?\s*\*?\s*([\s\S]*?)(?=\s*\*\s*@|\s*\*\/)/m)
    if (descMatch) {
      const desc = descMatch[1]
        .split('\n')
        .map(line => line.replace(/^\s*\*\s?/, ''))
        .join('\n')
        .replace(/\n\s*\n/g, '\n\n')
        .replace(/(?<!\n)\n(?!\n)/g, ' ')
        .replace(/  +/g, ' ')
        .replace(/\{@link\s+(\w+)\}/g, '`$1`')
        .trim()
      if (desc) {
        output += desc + '\n\n'
      }
    }

    // Format the interface as a code block
    // Convert single-line JSDoc /** ... */ to // comments
    const cleanBody = body
      .split('\n')
      .map(line => {
        const jsdocInline = line.match(/^\s*\/\*\*\s*(.*?)\s*\*\/\s*$/)
        if (jsdocInline) {
          return line.replace(/\/\*\*\s*(.*?)\s*\*\//, '// $1')
        }
        return line.trimEnd()
      })
      .filter(line => line.trim() !== '')
      .join('\n')

    output += '```ts\ninterface ' + name + ' {\n' + cleanBody + '\n}\n```\n\n'

    // Extract examples from JSDoc
    const examples = extractExamples(jsdoc)
    if (examples.length > 0) {
      output += '**Example:**\n\n'
      for (const example of examples) {
        output += '```js\n' + example + '\n```\n\n'
      }
    }
  }

  return output
}

generate().catch((err) => {
  console.error('Error generating documentation:', err)
  process.exit(1)
})
