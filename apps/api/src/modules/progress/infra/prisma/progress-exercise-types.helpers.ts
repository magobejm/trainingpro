import { selectRecordedSportRecords } from './sport-progress-records';
import { intervalCoverage, setCoverage } from './progress-metric-coverage';
import { aggregateExerciseSets } from '../../domain/metrics/exercise-metrics';
import type { Prisma } from '@prisma/client';
import { heartRateBandPoint, sessionOutcome } from '@trainerpro/shared';
import { closedSessionWhere, outcomeSelect } from './closed-session';
import { toRpeNumber } from '../../../../common/plan/rpe-number';
import {
  isRecordedNumber,
  isRecordedNonNegative,
  sportLogHasData,
  sportSetHasData,
  summarizeCardioIntervals,
  summarizeIsometricSets,
  summarizeMobilitySets,
  summarizePlioSets,
} from '../../../../common/performed-set';
import type { PrismaService } from '../../../../common/prisma/prisma.service';
import {
  cardioPerformedWhere,
  isometricPerformedWhere,
  mobilityPerformedWhere,
  plioPerformedWhere,
  sportPerformedWhere,
  strengthPerformedWhere,
} from './performed-id-filters';
import type { ExerciseProgressQuery } from '../../domain/progress-repository.port';
import type { ExerciseProgressPoint, PerformedExercisesResult } from '../../domain/progress.models';

export type HeartProfile = { fcMax: number | null; fcRest: number | null };

const emptyHrFields = {
  avgHeartRate: null as number | null,
  avgPaceMinKm: null as number | null,
  fcReservePercent: null as number | null,
  plioEffort: null as number | null,
};

function buildSessionDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** min/km from total duration and distance */
export function paceMinPerKm(totalDurationSeconds: number | null, totalDistanceMeters: number | null): number | null {
  if (totalDurationSeconds === null || totalDistanceMeters === null || totalDurationSeconds <= 0 || totalDistanceMeters <= 0)
    return null;
  const km = totalDistanceMeters / 1000;
  const min = totalDurationSeconds / 60;
  return Math.round((min / km) * 100) / 100;
}

export function computeFcReservePercent(avgHr: number | null, fcMax: number | null, fcRest: number | null): number | null {
  if (avgHr === null || fcMax === null || fcRest === null) return null;
  if (fcMax <= fcRest) return null;
  const pct = ((avgHr - fcRest) / (fcMax - fcRest)) * 100;
  return Math.round(Math.min(100, Math.max(0, pct)) * 10) / 10;
}

export async function readCardioExerciseProgress(
  prisma: PrismaService,
  clientId: string,
  query: ExerciseProgressQuery,
  heartProfile: HeartProfile,
): Promise<ExerciseProgressPoint[]> {
  const rows = await prisma.intervalLog.findMany({
    where: {
      sessionCardioBlock: { sourceCardioMethodId: query.exerciseId },
      session: { archivedAt: null, clientId, ...closedSessionWhere, sessionDate: { gte: query.from, lte: query.to } },
    },
    select: {
      effortRpe: true,
      durationSecondsDone: true,
      distanceDoneMeters: true,
      avgHeartRate: true,
      sessionId: true,
      session: { select: { sessionDate: true, ...outcomeSelect } },
    },
    orderBy: [{ session: { sessionDate: 'asc' } }],
  });
  const bySession = new Map<string, { rows: typeof rows; sessionDate: Date }>();
  for (const row of rows) {
    const entry = bySession.get(row.sessionId) ?? { rows: [], sessionDate: row.session.sessionDate };
    entry.rows.push(row);
    bySession.set(row.sessionId, entry);
  }
  return [...bySession.entries()].flatMap(([sessionId, entry]) => {
    const summary = summarizeCardioIntervals(
      entry.rows.map((row) => ({
        avgHeartRate: row.avgHeartRate,
        distanceDoneMeters: row.distanceDoneMeters,
        durationSecondsDone: row.durationSecondsDone,
        effortRpe: toRpeNumber(row.effortRpe),
      })),
    );
    if (summary.sets === 0) return [];
    const paceRows = entry.rows.filter(
      (row) => isRecordedNumber(row.durationSecondsDone) && isRecordedNumber(row.distanceDoneMeters),
    );
    const avgPaceMinKm = paceMinPerKm(
      paceRows.reduce((sum, row) => sum + row.durationSecondsDone!, 0),
      paceRows.reduce((sum, row) => sum + row.distanceDoneMeters!, 0),
    );
    const fcReservePercent = computeFcReservePercent(summary.avgHeartRate, heartProfile.fcMax, heartProfile.fcRest);
    return [
      {
        sessionDate: buildSessionDate(entry.sessionDate),
        sessionId,
        outcome: sessionOutcome(entry.rows[0]!.session),
        hasRecordedData: true,
        sets: summary.sets,
        metricCoverage: intervalCoverage(
          entry.rows.map((row) => ({ ...row, effortRpe: toRpeNumber(row.effortRpe) })),
          heartProfile,
        ),
        totalReps: null,
        tonnage: null,
        avgRpe: summary.avgRpe,
        e1rm: null,
        inol: null,
        totalDurationSeconds: summary.totalDurationSeconds,
        durationMinutes: summary.totalDurationSeconds !== null ? summary.totalDurationSeconds / 60 : null,
        avgHeartRate: summary.avgHeartRate,
        avgPaceMinKm,
        fcReservePercent,
        plioEffort: null,
        setDetails: [],
      },
    ];
  });
}

export async function readPlioProgress(
  prisma: PrismaService,
  clientId: string,
  query: ExerciseProgressQuery,
): Promise<ExerciseProgressPoint[]> {
  const rows = await prisma.plioSetLog.findMany({
    where: {
      sessionPlioBlock: { sourcePlioExerciseId: query.exerciseId },
      session: { archivedAt: null, clientId, ...closedSessionWhere, sessionDate: { gte: query.from, lte: query.to } },
    },
    select: {
      setIndex: true,
      repsDone: true,
      effortRpe: true,
      weightDoneKg: true,
      durationSecondsDone: true,
      sessionId: true,
      session: { select: { sessionDate: true, ...outcomeSelect } },
    },
    orderBy: [{ session: { sessionDate: 'asc' } }, { setIndex: 'asc' }],
  });
  const bySession = new Map<string, { sessionDate: Date; sets: typeof rows }>();
  for (const row of rows) {
    const entry = bySession.get(row.sessionId) ?? { sessionDate: row.session.sessionDate, sets: [] };
    entry.sets.push(row);
    bySession.set(row.sessionId, entry);
  }
  return [...bySession.entries()].flatMap(([sessionId, { sessionDate, sets }]) => {
    const summary = summarizePlioSets(
      sets.map((set) => ({
        durationSecondsDone: set.durationSecondsDone,
        effortRpe: toRpeNumber(set.effortRpe),
        repsDone: set.repsDone,
        weightDoneKg: set.weightDoneKg !== null ? Number(set.weightDoneKg) : null,
      })),
    );
    if (summary.sets === 0) return [];
    const effortSets = sets.filter(
      (set) => isRecordedNonNegative(set.repsDone) && isRecordedNumber(toRpeNumber(set.effortRpe)),
    );
    const plioEffort = effortSets.length
      ? Math.round(effortSets.reduce((sum, set) => sum + (set.repsDone! * toRpeNumber(set.effortRpe)!) / 10, 0) * 100) / 100
      : null;
    return [
      {
        sessionDate: buildSessionDate(sessionDate),
        sessionId,
        outcome: sessionOutcome(sets[0]!.session),
        hasRecordedData: true,
        sets: summary.sets,
        metricCoverage: setCoverage(sets, 'plio'),
        totalReps: summary.totalReps,
        tonnage: summary.tonnage,
        avgRpe: summary.avgRpe,
        e1rm: null,
        inol: null,
        totalDurationSeconds: null,
        durationMinutes: null,
        ...emptyHrFields,
        plioEffort,
        setDetails: [],
      },
    ];
  });
}

export async function readMobilityProgress(
  prisma: PrismaService,
  clientId: string,
  query: ExerciseProgressQuery,
): Promise<ExerciseProgressPoint[]> {
  const rows = await prisma.mobilitySetLog.findMany({
    where: {
      sessionMobilityBlock: { sourceMobilityExerciseId: query.exerciseId },
      session: { archivedAt: null, clientId, ...closedSessionWhere, sessionDate: { gte: query.from, lte: query.to } },
    },
    select: {
      setIndex: true,
      repsDone: true,
      effortRpe: true,
      romDone: true,
      weightDoneKg: true,
      sessionId: true,
      session: { select: { sessionDate: true, ...outcomeSelect } },
    },
    orderBy: [{ session: { sessionDate: 'asc' } }, { setIndex: 'asc' }],
  });
  const bySession = new Map<string, { sessionDate: Date; sets: typeof rows }>();
  for (const row of rows) {
    const entry = bySession.get(row.sessionId) ?? { sessionDate: row.session.sessionDate, sets: [] };
    entry.sets.push(row);
    bySession.set(row.sessionId, entry);
  }
  return [...bySession.entries()].flatMap(([sessionId, { sessionDate, sets }]) => {
    const summary = summarizeMobilitySets(
      sets.map((set) => ({
        effortRpe: toRpeNumber(set.effortRpe),
        repsDone: set.repsDone,
        romDone: set.romDone,
        weightDoneKg: set.weightDoneKg !== null ? Number(set.weightDoneKg) : null,
      })),
    );
    if (summary.sets === 0) return [];
    return [
      {
        sessionDate: buildSessionDate(sessionDate),
        sessionId,
        outcome: sessionOutcome(sets[0]!.session),
        hasRecordedData: true,
        sets: summary.sets,
        metricCoverage: setCoverage(sets, 'mobility'),
        totalReps: summary.totalReps,
        tonnage: null,
        avgRpe: summary.avgRpe,
        e1rm: null,
        inol: null,
        totalDurationSeconds: null,
        durationMinutes: null,
        ...emptyHrFields,
        setDetails: [],
      },
    ];
  });
}

export async function readIsometricProgress(
  prisma: PrismaService,
  clientId: string,
  query: ExerciseProgressQuery,
): Promise<ExerciseProgressPoint[]> {
  const rows = await prisma.isometricSetLog.findMany({
    where: {
      sessionIsometricBlock: { sourceIsometricExerciseId: query.exerciseId },
      session: { archivedAt: null, clientId, ...closedSessionWhere, sessionDate: { gte: query.from, lte: query.to } },
    },
    select: {
      setIndex: true,
      durationSecondsDone: true,
      weightDoneKg: true,
      effortRpe: true,
      sessionId: true,
      session: { select: { sessionDate: true, ...outcomeSelect } },
    },
    orderBy: [{ session: { sessionDate: 'asc' } }, { setIndex: 'asc' }],
  });
  const bySession = new Map<string, { sessionDate: Date; sets: typeof rows }>();
  for (const row of rows) {
    const entry = bySession.get(row.sessionId) ?? { sessionDate: row.session.sessionDate, sets: [] };
    entry.sets.push(row);
    bySession.set(row.sessionId, entry);
  }
  return [...bySession.entries()].flatMap(([sessionId, { sessionDate, sets }]) => {
    const summary = summarizeIsometricSets(
      sets.map((set) => ({
        durationSecondsDone: set.durationSecondsDone,
        effortRpe: toRpeNumber(set.effortRpe),
        weightDoneKg: set.weightDoneKg !== null ? Number(set.weightDoneKg) : null,
      })),
    );
    if (summary.sets === 0) return [];
    return [
      {
        sessionDate: buildSessionDate(sessionDate),
        sessionId,
        outcome: sessionOutcome(sets[0]!.session),
        hasRecordedData: true,
        sets: summary.sets,
        metricCoverage: setCoverage(sets, 'isometric'),
        totalReps: null,
        tonnage: summary.tonnage,
        avgRpe: summary.avgRpe,
        e1rm: null,
        inol: null,
        totalDurationSeconds: summary.totalDurationSeconds,
        durationMinutes: null,
        ...emptyHrFields,
        plioEffort: summary.plioEffort,
        setDetails: [],
      },
    ];
  });
}

export async function readSportProgress(
  prisma: PrismaService,
  clientId: string,
  query: ExerciseProgressQuery,
  heartProfile: HeartProfile,
): Promise<ExerciseProgressPoint[]> {
  const blocks = await prisma.sessionSportBlock.findMany({
    where: {
      archivedAt: null,
      sourceSportId: query.exerciseId,
      session: { archivedAt: null, clientId, ...closedSessionWhere, sessionDate: { gte: query.from, lte: query.to } },
    },
    select: { sessionId: true, session: { select: { sessionDate: true, ...outcomeSelect } }, logs: true, setLogs: true },
    orderBy: { session: { sessionDate: 'asc' } },
  });
  const grouped = new Map<
    string,
    {
      session: (typeof blocks)[number]['session'];
      rows: Array<{
        durationSecondsDone: number | null;
        distanceDoneMeters: number | null;
        effortRpe: number | null;
        effortRir?: number | null;
        avgHeartRate: number | null;
        repsDone?: number | null;
        weightDoneKg?: number | null;
      }>;
    }
  >();
  for (const block of blocks) {
    const entry = grouped.get(block.sessionId) ?? { session: block.session, rows: [] };
    // Per-set records supersede the legacy summary for the same block.
    const records = selectRecordedSportRecords(block.setLogs, block.logs);
    const sets = records.sets
      .map((set) => ({
        ...set,
        weightDoneKg: set.weightDoneKg === null ? null : Number(set.weightDoneKg),
        effortRpe: toRpeNumber(set.effortRpe),
      }))
      .filter(sportSetHasData);
    if (sets.length)
      entry.rows.push(
        ...sets.map((set) => ({ ...set, avgHeartRate: heartRateBandPoint(set.heartRateDone, set.heartRateDoneMax) })),
      );
    else
      entry.rows.push(
        ...records.legacy
          .map((log) => ({ ...log, effortRpe: toRpeNumber(log.effortRpe) }))
          .filter(sportLogHasData)
          .map((log) => ({
            durationSecondsDone: log.durationMinutesDone === null ? null : log.durationMinutesDone * 60,
            distanceDoneMeters: null,
            effortRpe: log.effortRpe,
            avgHeartRate: log.avgHeartRate,
          })),
      );
    grouped.set(block.sessionId, entry);
  }
  return [...grouped].flatMap(([sessionId, entry]) => {
    if (!entry.rows.length) return [];
    const summary = summarizeCardioIntervals(entry.rows);
    const paceRows = entry.rows.filter(
      (row) => isRecordedNumber(row.durationSecondsDone) && isRecordedNumber(row.distanceDoneMeters),
    );
    const avgPaceMinKm = paceMinPerKm(
      paceRows.reduce((sum, row) => sum + row.durationSecondsDone!, 0),
      paceRows.reduce((sum, row) => sum + row.distanceDoneMeters!, 0),
    );
    const strength = aggregateExerciseSets(
      sessionId,
      entry.session.sessionDate,
      entry.rows.map((row, index) => ({
        setIndex: index + 1,
        repsDone: row.repsDone ?? null,
        weightDoneKg: row.weightDoneKg ?? null,
        effortRpe: row.effortRpe,
        effortRir: row.effortRir,
      })),
    );
    return [
      {
        ...strength,
        sessionId,
        sessionDate: buildSessionDate(entry.session.sessionDate),
        outcome: sessionOutcome(entry.session),
        hasRecordedData: true,
        sets: entry.rows.length,
        avgRpe: summary.avgRpe,
        totalDurationSeconds: summary.totalDurationSeconds,
        durationMinutes: summary.totalDurationSeconds === null ? null : summary.totalDurationSeconds / 60,
        avgHeartRate: summary.avgHeartRate,
        avgPaceMinKm,
        fcReservePercent: computeFcReservePercent(summary.avgHeartRate, heartProfile.fcMax, heartProfile.fcRest),
        metricCoverage: { ...strength.metricCoverage, ...intervalCoverage(entry.rows, heartProfile) },
      },
    ];
  });
}

type SessionWhereInput = {
  archivedAt: null;
  clientId: string;
  OR?: Prisma.SessionInstanceWhereInput[];
  isCompleted?: boolean;
  sessionDate: { gte: Date; lte: Date };
};

function uniqueIds(items: Array<null | string>): string[] {
  return [...new Set(items.filter((item): item is string => Boolean(item)))];
}

export async function readPerformedIds(
  prisma: PrismaService,
  sessionWhere: SessionWhereInput,
): Promise<[string[], string[], string[], string[], string[], string[]]> {
  const [sItems, cItems, pItems, mItems, iItems, spItems] = await Promise.all([
    prisma.sessionStrengthItem.findMany({
      where: strengthPerformedWhere(sessionWhere),
      select: { sourceExerciseId: true },
      distinct: ['sourceExerciseId'],
    }),
    prisma.sessionCardioBlock.findMany({
      where: cardioPerformedWhere(sessionWhere),
      select: { sourceCardioMethodId: true },
      distinct: ['sourceCardioMethodId'],
    }),
    prisma.sessionPlioBlock.findMany({
      where: plioPerformedWhere(sessionWhere),
      select: { sourcePlioExerciseId: true },
      distinct: ['sourcePlioExerciseId'],
    }),
    prisma.sessionMobilityBlock.findMany({
      where: mobilityPerformedWhere(sessionWhere),
      select: { sourceMobilityExerciseId: true },
      distinct: ['sourceMobilityExerciseId'],
    }),
    prisma.sessionIsometricBlock.findMany({
      where: isometricPerformedWhere(sessionWhere),
      select: { sourceIsometricExerciseId: true },
      distinct: ['sourceIsometricExerciseId'],
    }),
    prisma.sessionSportBlock.findMany({
      where: sportPerformedWhere(sessionWhere),
      select: { sourceSportId: true },
      distinct: ['sourceSportId'],
    }),
  ]);
  return [
    uniqueIds(sItems.map((r) => r.sourceExerciseId)),
    uniqueIds(cItems.map((r) => r.sourceCardioMethodId)),
    uniqueIds(pItems.map((r) => r.sourcePlioExerciseId)),
    uniqueIds(mItems.map((r) => r.sourceMobilityExerciseId)),
    uniqueIds(iItems.map((r) => r.sourceIsometricExerciseId)),
    uniqueIds(spItems.map((r) => r.sourceSportId)),
  ];
}

export async function fetchPerformedExerciseNames(
  prisma: PrismaService,
  [sIds, cIds, pIds, mIds, iIds, spIds]: [string[], string[], string[], string[], string[], string[]],
): Promise<PerformedExercisesResult> {
  const idSelect = { id: true, name: true } as const;
  const [exercises, cardioMethods, plioExercises, mobilityExercises, isometricExercises, sports] = await Promise.all([
    sIds.length > 0 ? prisma.exercise.findMany({ where: { id: { in: sIds } }, select: idSelect }) : [],
    cIds.length > 0 ? prisma.cardioMethod.findMany({ where: { id: { in: cIds } }, select: idSelect }) : [],
    pIds.length > 0 ? prisma.plioExercise.findMany({ where: { id: { in: pIds } }, select: idSelect }) : [],
    mIds.length > 0 ? prisma.mobilityExercise.findMany({ where: { id: { in: mIds } }, select: idSelect }) : [],
    iIds.length > 0 ? prisma.isometricExercise.findMany({ where: { id: { in: iIds } }, select: idSelect }) : [],
    spIds.length > 0 ? prisma.sport.findMany({ where: { id: { in: spIds } }, select: idSelect }) : [],
  ]);
  return {
    strength: exercises.map((e) => ({ id: e.id, name: e.name })),
    cardio: cardioMethods.map((e) => ({ id: e.id, name: e.name })),
    plio: plioExercises.map((e) => ({ id: e.id, name: e.name })),
    mobility: mobilityExercises.map((e) => ({ id: e.id, name: e.name })),
    isometric: isometricExercises.map((e) => ({ id: e.id, name: e.name })),
    sport: sports.map((e) => ({ id: e.id, name: e.name })),
  };
}
