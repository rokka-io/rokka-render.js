export interface StackOperation {
  name: string
  options?: {
    [key: string]: string | number | boolean | undefined | null
  }
  expressions?: {
    [key: string]: string | number | boolean | undefined | null
  }
}

export interface StackOptions {
  [key: string]: string | number | boolean
}
