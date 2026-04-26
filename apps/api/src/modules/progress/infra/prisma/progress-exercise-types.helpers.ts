import type { PrismaService } from '../../../../common/prisma/prisma.service';
import type { ExerciseProgressQuery } from '../../domain/progress-repository.port';
import type { ExerciseProgressPoint, PerformedExercisesResult } from '../../domain/progress.models';

export type HeartProfile = { fcMax: number | null; fcRest: number | null };

const emptyHrFields = {
  avgHeartRate: null as number | null,
  avgPaceMinKm: null as number | null,
  fcReservePercent: null as number | null,
  plioEffort: null as number | null,
};

function avgRpeFromSets(sets: Array<{ effortRpe: number | null }>): number | null {
  const rpeSets = sets.filter((r) => r.effortRpe !== null);
  if (rpeSets.length === 0) return null;
  const sum = rpeSets.reduce((acc, r) => acc + (r.effortRpe ?? 0), 0);
  return Math.round((sum / rpeSets.length) * 10) / 10;
}

function buildSessionDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** min/km from total duration and distance */
export function paceMinPerKm(totalDurationSeconds: number, totalDistanceMeters: number): number | null {
  if (totalDurationSeconds <= 0 || totalDistanceMeters <= 0) return null;
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
      session: { archivedAt: null, clientId, isCompleted: true, sessionDate: { gte: query.from, lte: query.to } },
    },
    select: {
      effortRpe: true,
      durationSecondsDone: true,
      distanceDoneMeters: true,
      avgHeartRate: true,
      sessionId: true,
      session: { select: { sessionDate: true } },
    },
    orderBy: [{ session: { sessionDate: 'asc' } }],
  });
  type CardioEntry = {
    sessionDate: Date;
    totalSecs: number;
    totalDistanceMeters: number;
    intervalCount: number;
    rpeSum: number;
    rpeCount: number;
    hrWeighted: number;
    hrWeightSecs: number;
  };
  const bySession = new Map<string, CardioEntry>();
  for (const row of rows) {
    const dur = row.durationSecondsDone ?? 0;
    const entry = bySession.get(row.sessionId) ?? {
      sessionDate: row.session.sessionDate,
      totalSecs: 0,
      totalDistanceMeters: 0,
      intervalCount: 0,
      rpeSum: 0,
      rpeCount: 0,
      hrWeighted: 0,
      hrWeightSecs: 0,
    };
    entry.intervalCount += 1;
    entry.totalSecs += dur;
    entry.totalDistanceMeters += row.distanceDoneMeters ?? 0;
    if (row.effortRpe !== null) {
      entry.rpeSum += row.effortRpe;
      entry.rpeCount++;
    }
    if (row.avgHeartRate !== null && dur > 0) {
      entry.hrWeighted += row.avgHeartRate * dur;
      entry.hrWeightSecs += dur;
    }
    bySession.set(row.sessionId, entry);
  }
  return [...bySession.entries()].map(([sessionId, e]) => {
    const avgRpe = e.rpeCount > 0 ? Math.round((e.rpeSum / e.rpeCount) * 10) / 10 : null;
    const avgHeartRate = e.hrWeightSecs > 0 ? Math.round(e.hrWeighted / e.hrWeightSecs) : null;
    const avgPaceMinKm = paceMinPerKm(e.totalSecs, e.totalDistanceMeters);
    const fcReservePercent = computeFcReservePercent(avgHeartRate, heartProfile.fcMax, heartProfile.fcRest);
    return {
      sessionDate: buildSessionDate(e.sessionDate),
      sessionId,
      sets: e.intervalCount,
      totalReps: 0,
      tonnage: 0,
      avgRpe,
      e1rm: null,
      inol: null,
      totalDurationSeconds: e.totalSecs,
      durationMinutes: Math.round(e.totalSecs / 60),
      avgHeartRate,
      avgPaceMinKm,
      fcReservePercent,
      plioEffort: null,
      setDetails: [],
    };
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
      session: { archivedAt: null, clientId, isCompleted: true, sessionDate: { gte: query.from, lte: query.to } },
    },
    select: {
      setIndex: true,
      repsDone: true,
      effortRpe: true,
      weightDoneKg: true,
      sessionId: true,
      session: { select: { sessionDate: true } },
    },
    orderBy: [{ session: { sessionDate: 'asc' } }, { setIndex: 'asc' }],
  });
  const bySession = new Map<string, { sessionDate: Date; sets: typeof rows }>();
  for (const row of rows) {
    const entry = bySession.get(row.sessionId) ?? { sessionDate: row.session.sessionDate, sets: [] };
    entry.sets.push(row);
    bySession.set(row.sessionId, entry);
  }
  return [...bySession.entries()].map(([sessionId, { sessionDate, sets }]) => {
    const totalReps = sets.reduce((acc, r) => acc + (r.repsDone ?? 0), 0);
    const avgRpe = avgRpeFromSets(sets);
    let tonnage = 0;
    for (const r of sets) {
      const w = r.weightDoneKg !== null ? Number(r.weightDoneKg) : 0;
      const reps = r.repsDone ?? 0;
      tonnage += w * reps;
    }
    tonnage = Math.round(tonnage * 100) / 100;
    const plioEffort = avgRpe !== null && totalReps > 0 ? Math.round(totalReps * (avgRpe / 10) * 100) / 100 : null;
    return {
      sessionDate: buildSessionDate(sessionDate),
      sessionId,
      sets: sets.length,
      totalReps,
      tonnage,
      avgRpe,
      e1rm: null,
      inol: null,
      totalDurationSeconds: null,
      durationMinutes: null,
      ...emptyHrFields,
      plioEffort,
      setDetails: [],
    };
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
      session: { archivedAt: null, clientId, isCompleted: true, sessionDate: { gte: query.from, lte: query.to } },
    },
    select: { setIndex: true, repsDone: true, effortRpe: true, sessionId: true, session: { select: { sessionDate: true } } },
    orderBy: [{ session: { sessionDate: 'asc' } }, { setIndex: 'asc' }],
  });
  const bySession = new Map<string, { sessionDate: Date; sets: typeof rows }>();
  for (const row of rows) {
    const entry = bySession.get(row.sessionId) ?? { sessionDate: row.session.sessionDate, sets: [] };
    entry.sets.push(row);
    bySession.set(row.sessionId, entry);
  }
  return [...bySession.entries()].map(([sessionId, { sessionDate, sets }]) => ({
    sessionDate: buildSessionDate(sessionDate),
    sessionId,
    sets: sets.length,
    totalReps: sets.reduce((acc, r) => acc + (r.repsDone ?? 0), 0),
    tonnage: 0,
    avgRpe: avgRpeFromSets(sets),
    e1rm: null,
    inol: null,
    totalDurationSeconds: null,
    durationMinutes: null,
    ...emptyHrFields,
    setDetails: [],
  }));
}

export async function readIsometricProgress(
  prisma: PrismaService,
  clientId: string,
  query: ExerciseProgressQuery,
): Promise<ExerciseProgressPoint[]> {
  const rows = await prisma.isometricSetLog.findMany({
    where: {
      sessionIsometricBlock: { sourceIsometricExerciseId: query.exerciseId },
      session: { archivedAt: null, clientId, isCompleted: true, sessionDate: { gte: query.from, lte: query.to } },
    },
    select: {
      setIndex: true,
      durationSecondsDone: true,
      weightDoneKg: true,
      effortRpe: true,
      sessionId: true,
      session: { select: { sessionDate: true } },
    },
    orderBy: [{ session: { sessionDate: 'asc' } }, { setIndex: 'asc' }],
  });
  const bySession = new Map<string, { sessionDate: Date; sets: typeof rows }>();
  for (const row of rows) {
    const entry = bySession.get(row.sessionId) ?? { sessionDate: row.session.sessionDate, sets: [] };
    entry.sets.push(row);
    bySession.set(row.sessionId, entry);
  }
  return [...bySession.entries()].map(([sessionId, { sessionDate, sets }]) => {
    const totalDurationSeconds = sets.reduce((acc, r) => acc + (r.durationSecondsDone ?? 0), 0);
    const avgRpe = avgRpeFromSets(sets);
    let tonnage = 0;
    for (const r of sets) {
      const w = r.weightDoneKg !== null ? Number(r.weightDoneKg) : 0;
      const mins = (r.durationSecondsDone ?? 0) / 60;
      tonnage += w * mins;
    }
    tonnage = Math.round(tonnage * 100) / 100;
    const plioEffort =
      avgRpe !== null && totalDurationSeconds > 0
        ? Math.round((totalDurationSeconds / 60) * (avgRpe / 10) * 100) / 100
        : null;
    return {
      sessionDate: buildSessionDate(sessionDate),
      sessionId,
      sets: sets.length,
      totalReps: 0,
      tonnage,
      avgRpe,
      e1rm: null,
      inol: null,
      totalDurationSeconds,
      durationMinutes: null,
      ...emptyHrFields,
      plioEffort,
      setDetails: [],
    };
  });
}

export async function readSportProgress(
  prisma: PrismaService,
  clientId: string,
  query: ExerciseProgressQuery,
  heartProfile: HeartProfile,
): Promise<ExerciseProgressPoint[]> {
  const rows = await prisma.sportSessionLog.findMany({
    where: {
      sessionSportBlock: { sourceSportId: query.exerciseId },
      session: { archivedAt: null, clientId, isCompleted: true, sessionDate: { gte: query.from, lte: query.to } },
    },
    select: {
      durationMinutesDone: true,
      effortRpe: true,
      avgHeartRate: true,
      sessionId: true,
      session: { select: { sessionDate: true } },
    },
    orderBy: [{ session: { sessionDate: 'asc' } }],
  });
  return rows.map((row) => {
    const dm = row.durationMinutesDone ?? 0;
    const avgHeartRate = row.avgHeartRate;
    const fcReservePercent = computeFcReservePercent(avgHeartRate, heartProfile.fcMax, heartProfile.fcRest);
    const totalReps = dm > 0 ? Math.round(dm * 8) : 0;
    return {
      sessionDate: buildSessionDate(row.session.sessionDate),
      sessionId: row.sessionId,
      sets: 1,
      totalReps,
      tonnage: 0,
      avgRpe: row.effortRpe,
      e1rm: null,
      inol: null,
      totalDurationSeconds: row.durationMinutesDone !== null ? row.durationMinutesDone * 60 : null,
      durationMinutes: row.durationMinutesDone,
      avgHeartRate,
      avgPaceMinKm: null,
      fcReservePercent,
      plioEffort: null,
      setDetails: [],
    };
  });
}

type SessionWhereInput = { archivedAt: null; clientId: string; isCompleted: boolean; sessionDate: { gte: Date; lte: Date } };

function uniqueIds(items: Array<null | string>): string[] {
  return [...new Set(items.filter((item): item is string => Boolean(item)))];
}

export async function readPerformedIds(
  prisma: PrismaService,
  sessionWhere: SessionWhereInput,
): Promise<[string[], string[], string[], string[], string[], string[]]> {
  const [sItems, cItems, pItems, mItems, iItems, spItems] = await Promise.all([
    prisma.sessionStrengthItem.findMany({
      where: { archivedAt: null, session: sessionWhere, sourceExerciseId: { not: null } },
      select: { sourceExerciseId: true },
      distinct: ['sourceExerciseId'],
    }),
    prisma.sessionCardioBlock.findMany({
      where: { archivedAt: null, session: sessionWhere, sourceCardioMethodId: { not: null } },
      select: { sourceCardioMethodId: true },
      distinct: ['sourceCardioMethodId'],
    }),
    prisma.sessionPlioBlock.findMany({
      where: { archivedAt: null, session: sessionWhere, sourcePlioExerciseId: { not: null } },
      select: { sourcePlioExerciseId: true },
      distinct: ['sourcePlioExerciseId'],
    }),
    prisma.sessionMobilityBlock.findMany({
      where: { archivedAt: null, session: sessionWhere, sourceMobilityExerciseId: { not: null } },
      select: { sourceMobilityExerciseId: true },
      distinct: ['sourceMobilityExerciseId'],
    }),
    prisma.sessionIsometricBlock.findMany({
      where: { archivedAt: null, session: sessionWhere, sourceIsometricExerciseId: { not: null } },
      select: { sourceIsometricExerciseId: true },
      distinct: ['sourceIsometricExerciseId'],
    }),
    prisma.sessionSportBlock.findMany({
      where: { archivedAt: null, session: sessionWhere, sourceSportId: { not: null } },
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
