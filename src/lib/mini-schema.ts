// Minimal JSON Schema (2020-12 subset) validator: type, const, enum, required, properties,
// additionalProperties (schema/boolean), items, minItems, pattern, maxLength, $ref (#/$defs/...).
// Enough to validate chatgpt-app-submission.v1.json without shipping a large dependency.
type S = Record<string, any>;
export interface SchemaError { path: string; message: string }

const typeOf = (v: unknown): string => (v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v);
const typeMatches = (v: unknown, t: string) => { const a = typeOf(v); return a === t || (t === 'number' && (a === 'integer' || a === 'number')); };

export function validate(schema: S, value: unknown, root: S = schema, path = '$', errors: SchemaError[] = []): SchemaError[] {
  if (schema.$ref) {
    const ref = String(schema.$ref);
    if (!ref.startsWith('#/')) throw new Error(`Unsupported $ref ${ref}`);
    const target = ref.slice(2).split('/').reduce((o: any, k) => o?.[k], root);
    return validate(target, value, root, path, errors);
  }
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t: string) => typeMatches(value, t))) { errors.push({ path, message: `must be ${types.join(' or ')}` }); return errors; }
  }
  if ('const' in schema && JSON.stringify(schema.const) !== JSON.stringify(value)) errors.push({ path, message: `must equal ${JSON.stringify(schema.const)}` });
  if (schema.enum && !schema.enum.some((e: unknown) => JSON.stringify(e) === JSON.stringify(value))) errors.push({ path, message: `must be one of ${schema.enum.join(', ')}` });
  if (typeof value === 'string') {
    if (schema.pattern && !new RegExp(schema.pattern, 'u').test(value)) errors.push({ path, message: `must match ${schema.pattern}` });
    if (schema.maxLength !== undefined && Array.from(value).length > schema.maxLength) errors.push({ path, message: `must be at most ${schema.maxLength} characters` });
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push({ path, message: `must have at least ${schema.minItems} items` });
    if (schema.items) value.forEach((v, i) => validate(schema.items, v, root, `${path}[${i}]`, errors));
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    for (const r of schema.required ?? []) if (!(r in obj)) errors.push({ path, message: `missing required property “${r}”` });
    const props = schema.properties ?? {};
    for (const [k, v] of Object.entries(obj)) {
      if (props[k]) validate(props[k], v, root, `${path}.${k}`, errors);
      else if (schema.additionalProperties === false) errors.push({ path: `${path}.${k}`, message: 'is not allowed' });
      else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') validate(schema.additionalProperties, v, root, `${path}.${k}`, errors);
    }
  }
  return errors;
}
