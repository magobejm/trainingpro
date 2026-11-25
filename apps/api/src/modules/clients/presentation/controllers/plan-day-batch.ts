import { BadRequestException } from '@nestjs/common';

export const PLAN_DAY_BATCH_MAX = 62;

export type PlanDayBatchRequest = { on: string; planDayId: string };

/** Lee items=planDayId@YYYY-MM-DD,...: quita duplicados y rechaza lo mal formado o demasiado grande. */
export function parsePlanDayBatch(raw: string | undefined): PlanDayBatchRequest[] {
  const entries = (raw ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (entries.length === 0) throw new BadRequestException('items is required');
  const seen = new Set<string>();
  const requests: PlanDayBatchRequest[] = [];
  for (const entry of entries) {
    const match = /^([A-Za-z0-9_-]{1,64})@(\d{4}-\d{2}-\d{2})$/.exec(entry);
    if (!match) throw new BadRequestException('items must look like planDayId@YYYY-MM-DD');
    if (seen.has(entry)) continue;
    seen.add(entry);
    requests.push({ on: match[2] as string, planDayId: match[1] as string });
  }
  if (requests.length > PLAN_DAY_BATCH_MAX) {
    throw new BadRequestException('items has too many entries (max ' + PLAN_DAY_BATCH_MAX + ')');
  }
  return requests;
}
