export const PHYSICAL_TEST_DAY_DONE = 'PHYSICAL_TEST_DAY_DONE';
export const PHYSICAL_TEST_DAY_PENDING = 'PHYSICAL_TEST_DAY_PENDING';

export type ScheduleDayCode = typeof PHYSICAL_TEST_DAY_DONE | typeof PHYSICAL_TEST_DAY_PENDING;

type ActiveSchedule = {
  resultId: string | null;
};

export type ScheduleDecision = { kind: 'create' } | { kind: 'replace' } | { code: ScheduleDayCode; kind: 'reject' };

/** Un día hecho no se sustituye. Un día pendiente solo se sustituye si el entrenador lo confirma. */
export function decidePhysicalTestSchedule(existing: ActiveSchedule | null, replace: boolean): ScheduleDecision {
  if (!existing) return { kind: 'create' };
  if (existing.resultId) return { code: PHYSICAL_TEST_DAY_DONE, kind: 'reject' };
  if (!replace) return { code: PHYSICAL_TEST_DAY_PENDING, kind: 'reject' };
  return { kind: 'replace' };
}

export function utcDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function formatDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}
