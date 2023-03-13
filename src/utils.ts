import { StackOperation, StackOptions } from './apis/stacks'

export function stringifyOperations(
  operations: StackOperation | StackOperation[],
): string {
  const stackoperations: StackOperation[] = Array.isArray(operations)
    ? operations
    : [operations]

  return stackoperations
    .map(operation => {
      const name = operation.name
      const options = Object.keys(operation.options || {})
        .map(
          k =>
            `${k}-${
              operation.options && operation.options[k]
                ? operation.options[k]
                : '__undefined__'
            }`,
        )
        .join('-')

      if (!options) {
        return name
      }

      return `${name}-${options}`
    })
    .join('--')
}

export function stringifyStackOptions(options: StackOptions): string {
  const allOptions: string[] = []
  Object.keys(options).forEach(key => {
    allOptions.push(`${key}-${options[key]}`)
  })
  return allOptions.join('-')
}

export const stringifyBool = (
  value: string | boolean | number,
): string | number => {
  if (value === false) {
    return 'false'
  }
  if (value === true) {
    return 'true'
  }
  return value
}
