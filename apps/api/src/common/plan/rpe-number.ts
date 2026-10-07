import type { Prisma } from '@prisma/client';

export function toRpeNumber(value: Prisma.Decimal | number | null | undefined): number | null {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
