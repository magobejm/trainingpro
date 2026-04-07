import { z } from 'zod';

/**
 * Hyphenated 128-bit identifier accepted by Postgres `uuid`.
 * Seed data may use non–RFC-4122 version/variant nibbles (e.g. `00000072-0001-0000-...`),
 * which `z.string().uuid()` rejects.
 */
export const postgresUuidString = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid UUID');
