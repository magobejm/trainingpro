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
    const weekStart = toWeekStart(row.sessionDate);
    const key = `${weekStart}:${row.methodType}`;
    const current = index.get(key) ?? createAccumulator(row.methodType, weekStart);
    current.totalDurationSeconds += row.durationSecondsDone ?? 0;
    current.totalDistanceMeters += row.distanceDoneMeters ?? 0;
    if (row.effortRpe !== null) {
      current.avgRpeSum += row.effortRpe;
      current.avgRpeTotal += 1;
    }
    if (row.avgHeartRate !== null) {
      current.avgHeartRateSum += row.avgHeartRate;
      current.avgHeartRateTotal += 1;
    }
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
    totalDistanceMeters: 0,
    totalDurationSeconds: 0,
    weekStart,
  };
}

function toOutput(row: CardioAccumulator): CardioWeeklyPoint {
  const avgHeartRate =
    row.avgHeartRateTotal > 0 ? round(row.avgHeartRateSum / row.avgHeartRateTotal) : null;
  const avgRpe = row.avgRpeTotal > 0 ? round(row.avgRpeSum / row.avgRpeTotal) : null;
  return {
    avgHeartRate,
    avgRpe,
    methodType: row.methodType,
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
