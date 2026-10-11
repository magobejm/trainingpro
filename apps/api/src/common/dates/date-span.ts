import type { RefinementCtx } from 'zod';

export const CALENDAR_MAX_DAYS = 62;
export const WELLNESS_MAX_DAYS = 93;
export const PROGRESS_MAX_DAYS = 400;

export function inclusiveUtcDays(from: string, to: string): number | null {
  const start = Date.parse(`${from}T00:00:00.000Z`);
  const end = Date.parse(`${to}T00:00:00.000Z`);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return Math.floor((end - start) / 86_400_000) + 1;
}

export function spanWithin(maxDays: number) {
  return (value: { from?: string; to?: string; dateFrom?: string; dateTo?: string }, ctx: RefinementCtx): void => {
    const from = value.from ?? value.dateFrom;
    const to = value.to ?? value.dateTo;
    if (!from || !to) return;
    const days = inclusiveUtcDays(from, to);
    if (days === null || days > maxDays) {
      ctx.addIssue({
        code: 'custom',
        message: `Date range exceeds ${maxDays} days`,
        path: [value.to ? 'to' : 'dateTo'],
      });
    }
  };
}
