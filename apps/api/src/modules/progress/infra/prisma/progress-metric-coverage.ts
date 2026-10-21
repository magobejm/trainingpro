import type { Prisma } from '@prisma/client';
import { toRpeNumber } from '../../../../common/plan/rpe-number';
import { isRecordedNumber, isRecordedNonNegative } from '../../../../common/performed-set';
export function intervalCoverage(
  rows: Array<{
    durationSecondsDone: number | null;
    distanceDoneMeters: number | null;
    effortRpe: number | null;
    avgHeartRate: number | null;
  }>,
  heartProfile?: { fcMax: number | null; fcRest: number | null },
): import('../../domain/progress.models').MetricCoverage {
  const keys = {
    totalDurationSeconds: 'durationSecondsDone',
    totalDistanceMeters: 'distanceDoneMeters',
    avgRpe: 'effortRpe',
    avgHeartRate: 'avgHeartRate',
  } as const;
  const coverage: import('../../domain/progress.models').MetricCoverage = Object.fromEntries(
    Object.entries(keys).map(([metric, field]) => [
      metric,
      {
        validSamples: rows.filter((row) =>
          field === 'avgHeartRate'
            ? isRecordedNumber(row.avgHeartRate) && isRecordedNumber(row.durationSecondsDone)
            : field === 'effortRpe'
              ? isRecordedNumber(row[field])
              : isRecordedNonNegative(row[field]),
        ).length,
        eligibleSamples: rows.length,
        unit: 'intervals' as const,
      },
    ]),
  );
  const paired = rows.filter((row) => isRecordedNumber(row.avgHeartRate) && isRecordedNumber(row.durationSecondsDone));
  coverage.avgHeartRate!.weightSeconds = paired.reduce((sum, row) => sum + row.durationSecondsDone!, 0);
  coverage.durationMinutes = { ...coverage.totalDurationSeconds! };
  coverage.avgPaceMinKm = {
    validSamples: rows.filter((row) => isRecordedNumber(row.durationSecondsDone) && isRecordedNumber(row.distanceDoneMeters))
      .length,
    eligibleSamples: rows.length,
    unit: 'intervals',
  };
  const validProfile =
    heartProfile?.fcMax != null && heartProfile?.fcRest != null && heartProfile.fcMax > heartProfile.fcRest;
  coverage.fcReservePercent = {
    ...coverage.avgHeartRate!,
    validSamples: validProfile ? paired.length : 0,
    weightSeconds: validProfile ? coverage.avgHeartRate!.weightSeconds : 0,
  };
  return coverage;
}

export function setCoverage(
  rows: Array<{
    repsDone?: number | null;
    durationSecondsDone?: number | null;
    effortRpe: Prisma.Decimal | number | null;
    weightDoneKg?: Prisma.Decimal | null;
  }>,
  kind: 'plio' | 'mobility' | 'isometric',
): import('../../domain/progress.models').MetricCoverage {
  const count = (test: (row: (typeof rows)[number]) => boolean) => ({
    validSamples: rows.filter(test).length,
    eligibleSamples: rows.length,
    unit: 'sets' as const,
  });
  const hasRpe = (row: (typeof rows)[number]) => isRecordedNumber(toRpeNumber(row.effortRpe));
  const hasAmount = (row: (typeof rows)[number]) =>
    isRecordedNonNegative(kind === 'isometric' ? row.durationSecondsDone : row.repsDone);
  const duration = count((row) => isRecordedNonNegative(row.durationSecondsDone));
  return {
    avgRpe: count(hasRpe),
    totalReps: count((row) => isRecordedNonNegative(row.repsDone)),
    tonnage: count(
      (row) =>
        kind !== 'mobility' && hasAmount(row) && row.weightDoneKg != null && isRecordedNonNegative(Number(row.weightDoneKg)),
    ),
    totalDurationSeconds: duration,
    plioEffort: count((row) => kind !== 'mobility' && hasAmount(row) && hasRpe(row)),
  };
}
