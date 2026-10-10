import fs from 'node:fs';
import path from 'node:path';

export const PAGINATION_KEYS = new Set(['cursor', 'limit', 'offset', 'page', 'perPage', 'skip', 'take']);

export type DtoFields = Map<string, string[]>;

export function readDtoFields(root: string): DtoFields {
  const fields: DtoFields = new Map();
  for (const file of walk(root)) {
    if (!file.endsWith('.dto.ts')) {
      continue;
    }
    for (const found of classesIn(fs.readFileSync(file, 'utf8'))) {
      fields.set(found.name, found.keys);
    }
  }
  return fields;
}

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function classesIn(source: string): Array<{ keys: string[]; name: string }> {
  const found: Array<{ keys: string[]; name: string }> = [];
  const pattern = /export class (\w+)/g;
  for (const match of source.matchAll(pattern)) {
    const name = match[1];
    if (!name) {
      continue;
    }
    found.push({ keys: schemaKeys(source, match.index ?? 0), name });
  }
  return found;
}

function schemaKeys(source: string, from: number): string[] {
  const schemaAt = source.indexOf('static schema', from);
  const objectAt = schemaAt < 0 ? -1 : source.indexOf('.object(', schemaAt);
  if (objectAt < 0 || objectAt > schemaAt + 400) {
    return [];
  }
  const brace = source.indexOf('{', objectAt);
  const end = matchingBrace(source, brace);
  return end < 0 ? [] : topLevelKeys(source.slice(brace + 1, end));
}

function matchingBrace(source: string, start: number): number {
  let depth = 0;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  return -1;
}

function topLevelKeys(body: string): string[] {
  const keys: string[] = [];
  const pattern = /(['"]?)([A-Za-z0-9_-]+)\1\s*:/g;
  for (const match of stripNested(body).matchAll(pattern)) {
    const key = match[2];
    if (key) {
      keys.push(key);
    }
  }
  return keys;
}

function stripNested(body: string): string {
  let flat = '';
  let depth = 0;
  for (const char of body) {
    if (char === '{' || char === '(' || char === '[') {
      depth += 1;
    } else if (char === '}' || char === ')' || char === ']') {
      depth = Math.max(0, depth - 1);
    } else if (depth === 0) {
      flat += char;
    }
  }
  return flat;
}
