import type { Prisma } from '@prisma/client';
import { resolveLockedFields, setVariablesForType, type ProgressExerciseRef } from '@trainerpro/shared';
import type { DailyRawSet } from '../domain/metrics/daily-exercise';

export const DAY = 86_400_000;
export const key = (date: Date) => date.toISOString().slice(0, 10);
export const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
export const list = (value: unknown): Record<string, unknown>[] => (Array.isArray(value) ? value.map(record) : []);
export const numeric = (value: unknown): number | null =>
  value === null || value === undefined || !Number.isFinite(Number(value)) ? null : Number(value);
export function cardioMetricDistance(
  headerDistance: number | null,
  seriesDistances: Array<number | null>,
  index: number,
): number | null | undefined {
  if (headerDistance === null || seriesDistances.some((value) => value !== null)) return undefined;
  return index === 0 ? headerDistance : null;
}
export const nonnegative = (value: unknown): number | null => {
  const result = numeric(value);
  return result !== null && result >= 0 ? result : null;
};
export const blockKinds = [
  ['strength', 'items', 'exercises', 'sourceExerciseId', 'exerciseLibraryId'],
  ['cardio', 'cardioBlocks', 'cardioBlocks', 'sourceCardioMethodId', 'cardioMethodLibraryId'],
  ['plio', 'plioBlocks', 'plioBlocks', 'sourcePlioExerciseId', 'plioExerciseLibraryId'],
  ['mobility', 'mobilityBlocks', 'mobilityBlocks', 'sourceMobilityExerciseId', 'mobilityExerciseLibraryId'],
  ['isometric', 'isometricBlocks', 'isometricBlocks', 'sourceIsometricExerciseId', 'isometricExerciseLibraryId'],
  ['sport', 'sportBlocks', 'sportBlocks', 'sourceSportId', 'sportLibraryId'],
] as const;
export const sessionInclude = {
  items: { where: { archivedAt: null }, include: { logs: true } },
  cardioBlocks: { where: { archivedAt: null }, include: { intervalLogs: true } },
  plioBlocks: { where: { archivedAt: null }, include: { logs: true } },
  mobilityBlocks: { where: { archivedAt: null }, include: { logs: true } },
  isometricBlocks: { where: { archivedAt: null }, include: { logs: true } },
  sportBlocks: { where: { archivedAt: null }, include: { setLogs: true, logs: true } },
} satisfies Prisma.SessionInstanceInclude;
export type Session = Prisma.SessionInstanceGetPayload<{ include: typeof sessionInclude }>;
type ExerciseRawSet = DailyRawSet & ProgressExerciseRef & { exerciseName: string };
export function flattenSession(session: Session, frozenContent?: unknown): ExerciseRawSet[] {
  const result: ExerciseRawSet[] = [];
  const source = record(session);
  for (const [exerciseType, sessionKey, , sourceKey] of blockKinds) {
    for (const block of list(source[sessionKey])) {
      const frozenDay = list(record(frozenContent).days).find((day) => numeric(day.dayIndex) === session.planDayIndex);
      const kind = blockKinds.find(([type]) => type === exerciseType)!;
      const frozenBlock = list(frozenDay?.[kind[2]]).find(
        (item) => item[kind[4]] === block[sourceKey] || item.id === block.id,
      );
      const locked = resolveLockedFields(
        exerciseType,
        Array.isArray(frozenBlock?.lockedFields) ? (frozenBlock.lockedFields as string[]) : undefined,
      );
      const variableNames: Record<string, string> = {
        weightKg: 'weightKg',
        reps: 'reps',
        rpe: 'rpe',
        rir: 'rir',
        rom: 'rom',
        durationSeconds: 'durationSeconds',
        distanceMeters: 'distanceMeters',
        heartRate: 'heartRate',
        fcMaxPct: 'fcMaxPercent',
        fcReservePct: 'fcReservePercent',
        restSeconds: 'restSeconds',
      };
      const activeVariables =
        exerciseType === 'sport'
          ? setVariablesForType('sport')
              .filter((field) => !locked.includes(field))
              .map((field) => variableNames[field]!)
          : undefined;
      let rows = list(block[exerciseType === 'cardio' ? 'intervalLogs' : exerciseType === 'sport' ? 'setLogs' : 'logs']);
      const validSportRows = rows.filter((row) =>
        [
          'repsDone',
          'weightDoneKg',
          'effortRpe',
          'durationSecondsDone',
          'distanceDoneMeters',
          'heartRateDone',
          'hrMaxPctDone',
          'hrReservePctDone',
          'effortRir',
          'romDone',
        ].some((field) => row[field] !== null && row[field] !== undefined),
      );
      if (exerciseType === 'sport' && validSportRows.length === 0)
        rows = list(block.logs).map((row) => ({
          ...row,
          durationSecondsDone: numeric(row.durationMinutesDone) === null ? null : Number(row.durationMinutesDone) * 60,
        }));
      const headerDistance = exerciseType === 'cardio' ? nonnegative(block.distanceDoneMeters) : null;
      if (exerciseType === 'cardio') {
        rows = rows.filter((row) =>
          [
            'effortRpe',
            'durationSecondsDone',
            'distanceDoneMeters',
            'avgHeartRate',
            'hrMaxPctDone',
            'hrReservePctDone',
          ].some((field) => row[field] !== null && row[field] !== undefined),
        );
        if (headerDistance !== null && !rows.length) rows = [{ intervalIndex: 1, headerOnly: true }];
      }
      const seriesDistances = rows.map((row) => nonnegative(row.distanceDoneMeters));
      rows.forEach((row, index) => {
        result.push({
          exerciseId: String(block[sourceKey] ?? block.id),
          exerciseType,
          name: String(block.displayName ?? 'Ejercicio'),
          exerciseName: String(block.displayName ?? 'Ejercicio'),
          sessionId: session.id,
          sessionDate: key(session.sessionDate),
          sessionTitle: session.planDayTitle ?? 'Sesión',
          incomplete: session.isIncomplete,
          setIndex: numeric(row.setIndex ?? row.intervalIndex) ?? index + 1,
          reps: nonnegative(row.repsDone),
          weightKg: nonnegative(row.weightDoneKg),
          rpe: nonnegative(row.effortRpe),
          rir: nonnegative(row.effortRir),
          durationSeconds: nonnegative(row.durationSecondsDone),
          distanceMeters: nonnegative(row.distanceDoneMeters),
          metricDistanceMeters: cardioMetricDistance(headerDistance, seriesDistances, index),
          heartRate: nonnegative(row.heartRateDone ?? row.avgHeartRate),
          fcMaxPercent: nonnegative(row.hrMaxPctDone),
          fcReservePercent: nonnegative(row.hrReservePctDone),
          restSeconds: nonnegative(row.restSecondsDone),
          rom: typeof row.romDone === 'string' && row.romDone ? row.romDone : null,
          activeVariables,
          headerOnly: row.headerOnly === true,
        });
      });
    }
  }
  return result;
}
