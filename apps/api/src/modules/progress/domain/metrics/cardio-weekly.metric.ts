import { cardioIntervalHasData, isRecordedNumber, isRecordedNonNegative } from '../../../../common/performed-set';
import type { CardioLogRow, CardioWeeklyPoint } from '../progress.models';
import { toWeekStart } from './week-start';

type CardioAccumulator = {
  avgHeartRateSum: number;
  avgHeartRateTotal: number;
  avgRpeSum: number;
  avgRpeTotal: number;
} & CardioWeeklyPoint;

export function aggregateCardioWeekly(rows: CardioLogRow[]): CardioWeeklyPoint[] {
  const index = new Map<string, CardioAccumulator>();
  for (const row of rows) {
    if (!cardioIntervalHasData(row)) continue;
    const weekStart = toWeekStart(row.sessionDate);
    const key = `${weekStart}:${row.methodType}`;
    const current = index.get(key) ?? createAccumulator(row.methodType, weekStart);
    if (isRecordedNonNegative(row.durationSecondsDone))
      current.totalDurationSeconds = (current.totalDurationSeconds ?? 0) + row.durationSecondsDone;
    if (isRecordedNonNegative(row.distanceDoneMeters))
      current.totalDistanceMeters = (current.totalDistanceMeters ?? 0) + row.distanceDoneMeters;
    if (isRecordedNumber(row.effortRpe)) {
      current.avgRpeSum += row.effortRpe;
      current.avgRpeTotal += 1;
    }
    if (isRecordedNumber(row.avgHeartRate) && isRecordedNumber(row.durationSecondsDone)) {
      current.avgHeartRateSum += row.avgHeartRate * row.durationSecondsDone;
      current.avgHeartRateTotal += row.durationSecondsDone;
    }
    const coverage: import('../progress.models').MetricCoverage =
      current.metricCoverage ??
      Object.fromEntries(
        ['totalDurationSeconds', 'totalDistanceMeters', 'avgRpe', 'avgHeartRate'].map((key) => [
          key,
          { validSamples: 0, eligibleSamples: 0, unit: 'intervals' as const },
        ]),
      );
    for (const [key, value] of Object.entries({
      totalDurationSeconds: row.durationSecondsDone,
      totalDistanceMeters: row.distanceDoneMeters,
      avgRpe: row.effortRpe,
      avgHeartRate: row.avgHeartRate,
    })) {
      coverage[key]!.eligibleSamples++;
      if (
        key === 'avgHeartRate'
          ? isRecordedNumber(value) && isRecordedNumber(row.durationSecondsDone)
          : key === 'avgRpe'
            ? isRecordedNumber(value)
            : isRecordedNonNegative(value)
      )
        coverage[key]!.validSamples++;
    }
    coverage.avgHeartRate!.weightSeconds = current.avgHeartRateTotal;
    current.metricCoverage = coverage;
    index.set(key, current);
  }
  return [...index.values()].map(toOutput).sort(sortCardio);
}

function createAccumulator(methodType: string, weekStart: string): CardioAccumulator {
  return {
    avgHeartRate: null,
    avgHeartRateSum: 0,
    avgHeartRateTotal: 0,
    avgRpe: null,
    avgRpeSum: 0,
    avgRpeTotal: 0,
    methodType,
    totalDistanceMeters: null,
    totalDurationSeconds: null,
    weekStart,
  };
}

function toOutput(row: CardioAccumulator): CardioWeeklyPoint {
  const avgHeartRate = row.avgHeartRateTotal > 0 ? Math.round(row.avgHeartRateSum / row.avgHeartRateTotal) : null;
  const avgRpe = row.avgRpeTotal > 0 ? round(row.avgRpeSum / row.avgRpeTotal) : null;
  return {
    avgHeartRate,
    avgRpe,
    methodType: row.methodType,
    metricCoverage: row.metricCoverage,
    totalDistanceMeters: row.totalDistanceMeters,
    totalDurationSeconds: row.totalDurationSeconds,
    weekStart: row.weekStart,
  };
}

function sortCardio(a: CardioWeeklyPoint, b: CardioWeeklyPoint): number {
  if (a.weekStart !== b.weekStart) {
    return a.weekStart.localeCompare(b.weekStart);
  }
  return a.methodType.localeCompare(b.methodType);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
