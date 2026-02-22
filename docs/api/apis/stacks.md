# apis/stacks

## Interfaces

### StackOperation

Defines a single image operation for dynamic stacks.

#### Examples

```ts
// Resize operation
const resize: StackOperation = {
  name: 'resize',
  options: { width: 300, height: 200 }
}
```

```ts
// Crop with expressions
const crop: StackOperation = {
  name: 'crop',
  options: { width: 100, height: 100 },
  expressions: { anchor_x: '$anchor_x' }
}
```

#### Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-expressions"></a> `expressions?` | `object` | Key-value pairs for dynamic expressions using stack variables |
| <a id="property-name"></a> `name` | `string` | The operation name (e.g., 'resize', 'crop', 'blur') |
| <a id="property-options"></a> `options?` | `object` | Key-value pairs for operation parameters |

***

### StackOptions

Stack-level options that modify rendering behavior.

Common options include:
- `af` (autoformat): Automatically select the best image format
- `optim` (optimization): Image optimization settings

#### Example

```ts
const options: StackOptions = {
  af: 1,      // Enable autoformat
  optim: 80   // Set optimization level
}
```

#### Indexable

```ts
[key: string]: string | number | boolean
```
