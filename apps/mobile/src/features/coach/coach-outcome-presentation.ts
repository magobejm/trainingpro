import type { SessionOutcome } from '@trainerpro/shared';
import { formatClock, toSetDisplayValue } from '@trainerpro/shared';
export type Adherence = {
  cutoffDate: string;
  percent: number | null;
  plannedCount: number;
  counts: Record<SessionOutcome, number>;
  unplannedSessionsCount: number;
  neat?: { done: number; expected: number; percent: number | null };
};
type Translate = (key: string, options?: Record<string, string | number>) => string;
export function adherenceText(a: Adherence, t: Translate): string[] {
  return [
    a.percent == null
      ? t('training.adherence.empty')
      : `${t('training.adherence.title')}: ${Math.round(a.percent * 10) / 10}%`,
    t('training.adherence.formula', { done: a.counts.done, planned: a.plannedCount, cutoff: a.cutoffDate }),
    ...Object.entries(a.counts).map(([outcome, count]) => `${t('training.outcome.' + outcome)}: ${count}`),
    t('training.adherence.unplanned', { count: a.unplannedSessionsCount }),
    ...(a.neat?.percent == null
      ? []
      : [t('training.adherence.neat', { done: a.neat.done, expected: a.neat.expected, percent: a.neat.percent })]),
  ];
}
export function coverageText(
  coverage:
    | Record<string, { validSamples: number; eligibleSamples: number; unit: string; weightSeconds?: number }>
    | undefined,
  t: Translate,
): string[] {
  return Object.entries(coverage ?? {}).flatMap(([key, c]) => [
    `${t('coachWorkspace.field.' + key, { defaultValue: key })}: ${t('training.coverage', { valid: c.validSamples, eligible: c.eligibleSamples, unit: t('training.coverage.' + c.unit) })}`,
    ...(c.weightSeconds != null ? [t('training.coverage.weight', { seconds: c.weightSeconds })] : []),
  ]);
}

const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

export function formatDateValue(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-ES');
}

export function progressValueText(key: string, value: unknown, t: Translate, _minuteDuration = false): string[] | null {
  void _minuteDuration;
  if (key === 'setIndex' && typeof value === 'number' && Number.isFinite(value)) return [String(value + 1)];
  if (key === 'advancedTechnique' && typeof value === 'string' && value) {
    return [t('coachWorkspace.technique.' + value)];
  }
  if (key === 'groupType' && (value === 'CIRCUIT' || value === 'SUPERSET')) {
    return [t('coachWorkspace.' + value)];
  }
  if (typeof value === 'string' && (/At$/.test(key) || ISO_DATE_TIME.test(value))) {
    return [formatDateValue(value)];
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (key === 'distanceMeters' || key === 'distanceDoneMeters') {
      return [String(toSetDisplayValue('cardio', 'distanceMeters', value))];
    }
    if (key === 'durationSeconds' || key === 'durationSecondsDone' || key === 'restSeconds' || key === 'restSecondsDone') {
      return [formatClock(value)];
    }
  }
  if (key === 'outcome') {
    const outcomes = ['done', 'incomplete', 'skipped', 'pending', 'in_progress'];
    return [typeof value === 'string' && outcomes.includes(value) ? t('training.outcome.' + value) : t('training.noRecord')];
  }
  if (key === 'metricCoverage') {
    return coverageText(
      value != null && typeof value === 'object' ? (value as Parameters<typeof coverageText>[0]) : undefined,
      t,
    );
  }
  return null;
}

export function sessionResultText(session: { outcome?: SessionOutcome; skipReason?: string | null }, t: Translate): string {
  return (
    (session.outcome ? t('training.outcome.' + session.outcome) : '—') +
    (session.skipReason ? ' · ' + session.skipReason : '')
  );
}

export function sessionMinutesTotal(
  sessions: Array<{ durationMinutes?: number | null }>,
  cardio: Array<{ totalDurationSeconds: number | null }> = [],
): number | null {
  const minutes = sessions.map((row) => row.durationMinutes).filter((v): v is number => typeof v === 'number');
  if (minutes.length) return minutes.reduce((sum, v) => sum + v, 0);
  const seconds = cardio.map((row) => row.totalDurationSeconds).filter((v): v is number => v != null);
  return seconds.length ? seconds.reduce((sum, v) => sum + v, 0) / 60 : null;
}

export function sessionMinutesByWeek(
  sessions: Array<{ sessionDate: string; durationMinutes?: number | null }>,
): Array<{ weekStart: string; minutes: number }> {
  const totals = new Map<string, number>();
  for (const session of sessions) {
    if (typeof session.durationMinutes !== 'number') continue;
    const week = mondayOf(session.sessionDate.slice(0, 10));
    totals.set(week, (totals.get(week) ?? 0) + session.durationMinutes);
  }
  return [...totals.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([weekStart, minutes]) => ({ weekStart, minutes }));
}

function mondayOf(day: string): string {
  const [year, month, date] = day.split('-').map(Number);
  const value = new Date(year ?? 1970, (month ?? 1) - 1, date ?? 1);
  value.setDate(value.getDate() - ((value.getDay() + 6) % 7));
  const nextMonth = String(value.getMonth() + 1).padStart(2, '0');
  const nextDay = String(value.getDate()).padStart(2, '0');
  return `${value.getFullYear()}-${nextMonth}-${nextDay}`;
}

export function visibleMeasurements<T extends { hipCm?: number | null; waistCm?: number | null; weightKg?: number | null }>(
  items: T[],
): T[] {
  return items.filter((item) => item.weightKg != null || item.waistCm != null || item.hipCm != null);
}
