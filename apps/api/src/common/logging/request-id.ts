import { randomUUID } from 'node:crypto';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function resolveRequestId(header: string | undefined): string {
  const value = header?.trim() ?? '';
  if (UUID.test(value)) {
    return value.toLowerCase();
  }
  return randomUUID();
}
