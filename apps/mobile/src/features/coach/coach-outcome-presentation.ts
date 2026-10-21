import type { SessionOutcome } from '@trainerpro/shared';
import { toSetDisplayValue } from '@trainerpro/shared';
export type Adherence = {
  cutoffDate: string;
  percent: number | null;
  plannedCount: number;
  counts: Record<SessionOutcome, number>;
  unplannedSessionsCount: number;
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

export function progressValueText(key: string, value: unknown, t: Translate, minuteDuration = false): string[] | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (key === 'distanceMeters' || key === 'distanceDoneMeters') {
      return [String(toSetDisplayValue('cardio', 'distanceMeters', value))];
    }
    if (minuteDuration && (key === 'durationSeconds' || key === 'durationSecondsDone')) {
      return [String(toSetDisplayValue('cardio', 'durationSeconds', value))];
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
