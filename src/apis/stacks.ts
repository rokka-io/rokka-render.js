/**
 * Defines a single image operation for dynamic stacks.
 *
 * @example
 * // Resize operation
 * const resize: StackOperation = {
 *   name: 'resize',
 *   options: { width: 300, height: 200 }
 * }
 *
 * @example
 * // Crop with expressions
 * const crop: StackOperation = {
 *   name: 'crop',
 *   options: { width: 100, height: 100 },
 *   expressions: { anchor_x: '$anchor_x' }
 * }
 */
export interface StackOperation {
  /** The operation name (e.g., 'resize', 'crop', 'blur') */
  name: string
  /** Key-value pairs for operation parameters */
  options?: {
    [key: string]: string | number | boolean | undefined | null
  }
  /** Key-value pairs for dynamic expressions using stack variables */
  expressions?: {
    [key: string]: string | number | boolean | undefined | null
  }
}

/**
 * Stack-level options that modify rendering behavior.
 *
 * Common options include:
 * - `af` (autoformat): Automatically select the best image format
 * - `optim` (optimization): Image optimization settings
 *
 * @example
 * const options: StackOptions = {
 *   af: 1,      // Enable autoformat
 *   optim: 80   // Set optimization level
 * }
 */
export interface StackOptions {
  [key: string]: string | number | boolean
}
