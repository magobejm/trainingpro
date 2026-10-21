import { expect, it } from 'vitest';
import { metricSamples, metricCoverageLines } from './metric-samples';
it('excludes missing values and preserves explicit zero', () => {
  expect(metricSamples([{ load: null }, { load: 0 }, { load: 10 }, { load: undefined }], 'load')).toEqual({
    values: [0, 10],
    average: 5,
    max: 10,
  });
  expect(metricSamples([{ load: null }], 'load')).toEqual({ values: [], average: null, max: null });
});
it('describes the denominator and duration used by each metric', () => {
  expect(
    metricCoverageLines(
      [{ metricCoverage: { load: { validSamples: 2, eligibleSamples: 4, unit: 'sets', weightSeconds: 150 } } }],
      'load',
      (k, o) => k + JSON.stringify(o ?? {}),
    ),
  ).toEqual([
    'training.recordedOnly{}',
    'training.coverage{"valid":2,"eligible":4,"unit":"training.coverage.sets{}"}',
    'training.coverage.weight{"seconds":150}',
  ]);
});
