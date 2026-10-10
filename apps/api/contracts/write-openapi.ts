import fs from 'node:fs';
import path from 'node:path';
import { buildOpenApiDocument } from './openapi-document';
import { scanControllers } from './route-scan';

const document = buildOpenApiDocument(scanControllers(path.resolve('src/modules')));
fs.writeFileSync(path.resolve('openapi.json'), `${JSON.stringify(sortValue(document), null, 2)}\n`);

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortValue((value as Record<string, unknown>)[key])]),
  );
}
