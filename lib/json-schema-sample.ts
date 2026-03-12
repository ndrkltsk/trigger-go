/**
 * Generates a sample JSON value from a JSON Schema.
 * Supports common types: object, array, string, number, integer, boolean.
 * Uses `default` or `examples` when available, otherwise produces sensible placeholders.
 */
export function generateSampleFromSchema(
  schema: Record<string, unknown>,
  seen = new Set<Record<string, unknown>>()
): unknown {
  if (seen.has(schema)) return undefined;
  seen.add(schema);

  // Use default if provided
  if ('default' in schema) return schema.default;

  // Use first example if provided
  if (Array.isArray(schema.examples) && schema.examples.length > 0) {
    return schema.examples[0];
  }

  // Handle enum
  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return schema.enum[0];
  }

  // Handle const
  if ('const' in schema) return schema.const;

  // Handle oneOf / anyOf — use first option
  const oneOf = schema.oneOf ?? schema.anyOf;
  if (Array.isArray(oneOf) && oneOf.length > 0) {
    return generateSampleFromSchema(oneOf[0] as Record<string, unknown>, seen);
  }

  const type = schema.type as string | string[] | undefined;
  const resolvedType = Array.isArray(type) ? type.find((t) => t !== 'null') ?? type[0] : type;

  switch (resolvedType) {
    case 'object': {
      const result: Record<string, unknown> = {};
      const properties = schema.properties as Record<string, Record<string, unknown>> | undefined;
      if (properties) {
        for (const [key, propSchema] of Object.entries(properties)) {
          result[key] = generateSampleFromSchema(propSchema, seen);
        }
      }
      return result;
    }

    case 'array': {
      const items = schema.items as Record<string, unknown> | undefined;
      if (items) {
        return [generateSampleFromSchema(items, seen)];
      }
      return [];
    }

    case 'string':
      return '';

    case 'number':
    case 'integer':
      return 0;

    case 'boolean':
      return false;

    case 'null':
      return null;

    default:
      // No type specified but has properties — treat as object
      if (schema.properties) {
        const result: Record<string, unknown> = {};
        const properties = schema.properties as Record<string, Record<string, unknown>>;
        for (const [key, propSchema] of Object.entries(properties)) {
          result[key] = generateSampleFromSchema(propSchema, seen);
        }
        return result;
      }
      return undefined;
  }
}
