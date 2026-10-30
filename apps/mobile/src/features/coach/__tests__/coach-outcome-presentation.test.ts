import { coachWorkspaceLocale } from '../../../i18n/coach-workspace.locale';
import { adherenceText, coverageText, progressValueText, sessionResultText } from '../coach-outcome-presentation';
const t = (key: string, options?: Record<string, string | number>) => key + JSON.stringify(options ?? {});
it('displays recorded distances in km and durations as a clock', () => {
  expect(progressValueText('distanceDoneMeters', 1250, t)).toEqual(['1.25']);
  expect(progressValueText('distanceMeters', 1250, t)).toEqual(['1.25']);
  expect(progressValueText('distanceDoneMeters', 0, t)).toEqual(['0']);
  expect(progressValueText('durationSecondsDone', 150, t)).toEqual(['2 min 30 s']);
  expect(progressValueText('restSecondsDone', 150, t)).toEqual(['2 min 30 s']);
});
it('uses the API denominator and cutoff, preserving an empty agenda', () => {
  const lines = adherenceText(
    {
      cutoffDate: '2026-10-19',
      percent: null,
      plannedCount: 0,
      counts: { done: 0, incomplete: 0, skipped: 0, pending: 0, in_progress: 0 },
      unplannedSessionsCount: 2,
    },
    t,
  );
  expect(lines[0]).toBe('training.adherence.empty{}');
  expect(lines[1]).toBe('training.adherence.formula{"done":0,"planned":0,"cutoff":"2026-10-19"}');
  expect(lines.at(-1)).toBe('training.adherence.unplanned{"count":2}');
});
it('reports a zero valid sample count without substituting prescription', () => {
  expect(coverageText({ sessionTonnage: { validSamples: 0, eligibleSamples: 3, unit: 'sets' } }, t)).toEqual([
    'coachWorkspace.field.sessionTonnage{"defaultValue":"sessionTonnage"}: training.coverage{"valid":0,"eligible":3,"unit":"training.coverage.sets{}"}',
  ]);
});

it('translates outcomes and formats coverage without exposing API field internals', () => {
  expect(progressValueText('outcome', 'incomplete', t)).toEqual(['training.outcome.incomplete{}']);
  const lines = progressValueText(
    'metricCoverage',
    { totalTonnage: { validSamples: 0, eligibleSamples: 3, unit: 'sets', weightSeconds: 120 } },
    t,
  )!;
  expect(lines.join(' ')).not.toMatch(/validSamples|eligibleSamples|weightSeconds/);
  expect(lines.join(' ')).toContain('training.coverage');
  expect(progressValueText('tonnage', 0, t)).toBeNull();
});
it('labels the actual progress metrics in Spanish and English', () => {
  for (const locale of ['es', 'en'] as const) {
    const translations = coachWorkspaceLocale(locale);
    for (const field of [
      'totalTonnage',
      'tonnage',
      'inol',
      'fcReservePercent',
      'avgHeartRate',
      'avgPaceMinKm',
      'avgE1rm',
      'totalTrainingLoad',
      'sessionsCount',
      'recordsBroken',
      'plioEffort',
      'totalSrpe',
      'metricCoverage',
      'outcome',
    ]) {
      expect(translations['coachWorkspace.field.' + field]).toBeTruthy();
      expect(translations['coachWorkspace.field.' + field]).not.toBe(field);
    }
  }
  const es = coachWorkspaceLocale('es');
  const lines = coverageText(
    { totalTonnage: { validSamples: 0, eligibleSamples: 3, unit: 'sets' } },
    (key) => es[key] ?? key,
  );
  expect(lines[0]).toMatch(/^Tonelaje total/);
});

it('preserves the user reason in a skipped session result for PDF', () => {
  const translate = (key: string) => (key === 'training.outcome.skipped' ? 'No hecho' : key);
  expect(sessionResultText({ outcome: 'skipped', skipReason: 'Viaje familiar · sin gimnasio' }, translate)).toBe(
    'No hecho · Viaje familiar · sin gimnasio',
  );
  expect(sessionResultText({ outcome: 'skipped', skipReason: null }, translate)).toBe('No hecho');
});
