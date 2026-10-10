import { z } from 'zod';

export type JsonSchema = Record<string, unknown>;

export function toJsonSchema(schema: z.ZodType): JsonSchema {
  const produced = z.toJSONSchema(schema) as JsonSchema;
  delete produced.$schema;
  return produced;
}
