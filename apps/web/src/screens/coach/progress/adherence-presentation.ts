import type { AdherenceResult } from '../../../data/hooks/useAdherenceQuery';
export function adherenceLines(
  result: AdherenceResult,
  t: (key: string, options?: Record<string, string | number>) => string,
): string[] {
  return [
    result.percent == null
      ? t('training.adherence.empty')
      : `${t('training.adherence.title')}: ${Math.round(result.percent * 10) / 10}%`,
    t('training.adherence.formula', { done: result.counts.done, planned: result.plannedCount, cutoff: result.cutoffDate }),
    ...Object.entries(result.counts).map(([outcome, count]) => `${t('training.outcome.' + outcome)}: ${count}`),
    t('training.adherence.unplanned', { count: result.unplannedSessionsCount }),
  ];
}
