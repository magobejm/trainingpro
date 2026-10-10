import { CONTRACTED_ROUTES } from './contracted-routes';
import type { JsonSchema } from './json-schema';

export type OpenApiDocument = {
  components?: { schemas?: Record<string, JsonSchema> };
  paths?: Record<string, Record<string, JsonSchema>>;
};

type Operation = {
  parameters?: Array<{ in?: string; name?: string; required?: boolean }>;
  responses?: Record<string, { content?: { 'application/json'?: { schema?: JsonSchema } } }>;
};

export function findBreakingChanges(base: OpenApiDocument, next: OpenApiDocument): string[] {
  return CONTRACTED_ROUTES.flatMap((route) => routeBreaks(route, base, next));
}

function routeBreaks(route: { method: string; path: string }, base: OpenApiDocument, next: OpenApiDocument): string[] {
  const label = `${route.method.toUpperCase()} ${route.path}`;
  const before = operation(base, route.method, route.path);
  const after = operation(next, route.method, route.path);
  if (!after) {
    return [`${label} desapareció`];
  }
  if (!before) {
    return [];
  }
  return [
    ...parameterBreaks(label, before, after),
    ...schemaBreaks(label, responseSchema(before), responseSchema(after), base, next),
  ];
}

function operation(doc: OpenApiDocument, method: string, path: string): Operation | undefined {
  return doc.paths?.[path]?.[method] as Operation | undefined;
}

function responseSchema(operationNode: Operation): JsonSchema {
  return operationNode.responses?.['200']?.content?.['application/json']?.schema ?? {};
}

function parameterBreaks(label: string, before: Operation, after: Operation): string[] {
  const previous = requiredParams(before);
  return requiredParams(after)
    .filter((param) => !previous.some((item) => item.in === param.in && item.name === param.name))
    .map((param) => `${label} exige ${param.in} ${param.name}`);
}

function requiredParams(operationNode: Operation): Array<{ in: string; name: string }> {
  return (operationNode.parameters ?? []).flatMap((param) => {
    if (!param.required || !param.name || !param.in) {
      return [];
    }
    return [{ in: param.in, name: param.name }];
  });
}

function schemaBreaks(
  pointer: string,
  base: JsonSchema,
  next: JsonSchema,
  baseDoc: OpenApiDocument,
  nextDoc: OpenApiDocument,
): string[] {
  const left = flatten(resolveSchema(base, baseDoc));
  const right = flatten(resolveSchema(next, nextDoc));
  const branches = branchBreaks(pointer, left, right, baseDoc, nextDoc);
  if (branches) {
    return branches;
  }
  return [...typeBreaks(pointer, left, right), ...propertyBreaks(pointer, left, right, baseDoc, nextDoc)];
}

function branchBreaks(
  pointer: string,
  left: JsonSchema,
  right: JsonSchema,
  baseDoc: OpenApiDocument,
  nextDoc: OpenApiDocument,
): string[] | null {
  const before = unionBranches(left);
  if (!before) {
    return null;
  }
  const after = unionBranches(right) ?? [];
  return before.flatMap((branch) => {
    const match = after.find((item) => branchKey(item) === branchKey(branch));
    if (!match) {
      return [`${pointer} perdió la variante ${branchKey(branch)}`];
    }
    return schemaBreaks(`${pointer} ${branchKey(branch)}`, branch, match, baseDoc, nextDoc);
  });
}

function unionBranches(schema: JsonSchema): JsonSchema[] | null {
  const branches = schema.oneOf ?? schema.anyOf;
  return Array.isArray(branches) ? (branches as JsonSchema[]) : null;
}

function branchKey(schema: JsonSchema): string {
  const properties = schema.properties as JsonSchema | undefined;
  const typeField = properties?.type as JsonSchema | undefined;
  if (typeof typeField?.const === 'string') {
    return typeField.const;
  }
  if (typeof schema.title === 'string') {
    return schema.title;
  }
  const names = Object.keys(properties ?? {})
    .sort()
    .join(',');
  return `${String(schema.type ?? 'schema')}:${names}`;
}

function typeBreaks(pointer: string, left: JsonSchema, right: JsonSchema): string[] {
  if (left.properties || right.properties || unionBranches(left) || unionBranches(right)) {
    return [];
  }
  return fingerprint(left) === fingerprint(right) ? [] : [`${pointer} cambió de tipo`];
}

function propertyBreaks(
  pointer: string,
  left: JsonSchema,
  right: JsonSchema,
  baseDoc: OpenApiDocument,
  nextDoc: OpenApiDocument,
): string[] {
  const leftProps = (left.properties ?? {}) as Record<string, JsonSchema>;
  const rightProps = (right.properties ?? {}) as Record<string, JsonSchema>;
  const required = ((left.required as string[] | undefined) ?? []).filter((key) => leftProps[key]);
  const missing = required.flatMap((key) => requiredFieldBreak(pointer, key, left, right, rightProps));
  const nested = Object.keys(leftProps).flatMap((key) => {
    const rightProp = rightProps[key];
    const leftProp = leftProps[key];
    return leftProp && rightProp ? schemaBreaks(`${pointer}.${key}`, leftProp, rightProp, baseDoc, nextDoc) : [];
  });
  const items = itemBreaks(pointer, left, right, baseDoc, nextDoc);
  return [...missing, ...nested, ...items];
}

function requiredFieldBreak(
  pointer: string,
  key: string,
  left: JsonSchema,
  right: JsonSchema,
  rightProps: Record<string, JsonSchema>,
): string[] {
  if (!wasRequired(left, key)) {
    return [];
  }
  if (!rightProps[key]) {
    return [`${pointer}.${key} desapareció`];
  }
  return wasRequired(right, key) ? [] : [`${pointer}.${key} dejó de ser obligatorio`];
}

function itemBreaks(
  pointer: string,
  left: JsonSchema,
  right: JsonSchema,
  baseDoc: OpenApiDocument,
  nextDoc: OpenApiDocument,
): string[] {
  if (!left.items || !right.items) {
    return [];
  }
  return schemaBreaks(`${pointer}[]`, left.items as JsonSchema, right.items as JsonSchema, baseDoc, nextDoc);
}

function wasRequired(schema: JsonSchema, key: string): boolean {
  return ((schema.required as string[] | undefined) ?? []).includes(key);
}

function resolveSchema(schema: JsonSchema, doc: OpenApiDocument): JsonSchema {
  const ref = schema.$ref;
  if (typeof ref !== 'string') {
    return schema;
  }
  return doc.components?.schemas?.[ref.slice('#/components/schemas/'.length)] ?? schema;
}

function flatten(schema: JsonSchema): JsonSchema {
  if (!Array.isArray(schema.allOf)) {
    return schema;
  }
  const properties: Record<string, JsonSchema> = {};
  const required: string[] = [];
  for (const part of schema.allOf as JsonSchema[]) {
    const flat = flatten(part);
    Object.assign(properties, (flat.properties as Record<string, JsonSchema> | undefined) ?? {});
    required.push(...((flat.required as string[] | undefined) ?? []));
  }
  return { ...schema, properties, required, type: schema.type ?? 'object' };
}

function fingerprint(schema: JsonSchema): string {
  return JSON.stringify({
    const: schema.const ?? null,
    enum: schema.enum ?? null,
    format: schema.format ?? null,
    type: schema.type ?? null,
  });
}
