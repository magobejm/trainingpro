type Translate = (key: string, options?: Record<string, string | number>) => string;
export function metricSamples(points: Record<string, unknown>[], key: string) {
  const values = points.map((p) => p[key]).filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  return {
    values,
    average: values.length ? values.reduce((s, v) => s + v, 0) / values.length : null,
    max: values.length ? Math.max(...values) : null,
  };
}
export function metricCoverageLines(points: Record<string, unknown>[], key: string, t: Translate): string[] {
  const groups = new Map<string, { valid: number; eligible: number; weight: number; weighted: boolean }>();
  for (const point of points) {
    const coverage = (
      point.metricCoverage as
        | Record<string, { validSamples: number; eligibleSamples: number; unit: string; weightSeconds?: number }>
        | undefined
    )?.[key];
    if (!coverage) continue;
    const group = groups.get(coverage.unit) ?? { valid: 0, eligible: 0, weight: 0, weighted: false };
    group.valid += coverage.validSamples;
    group.eligible += coverage.eligibleSamples;
    if (coverage.weightSeconds != null) {
      group.weight += coverage.weightSeconds;
      group.weighted = true;
    }
    groups.set(coverage.unit, group);
  }
  return [
    t('training.recordedOnly'),
    ...Array.from(groups, ([unit, g]) => [
      t('training.coverage', { valid: g.valid, eligible: g.eligible, unit: t('training.coverage.' + unit) }),
      ...(g.weighted ? [t('training.coverage.weight', { seconds: g.weight })] : []),
    ]).flat(),
  ];
}
