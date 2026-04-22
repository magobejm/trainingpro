import type { PrismaService } from '../../../../common/prisma/prisma.service';
import type { ExerciseProgressQuery } from '../../domain/progress-repository.port';
import type { ExerciseProgressPoint, PerformedExercisesResult } from '../../domain/progress.models';

function avgRpeFromSets(sets: Array<{ effortRpe: number | null }>): number | null {
  const rpeSets = sets.filter((r) => r.effortRpe !== null);
  if (rpeSets.length === 0) return null;
  const sum = rpeSets.reduce((acc, r) => acc + (r.effortRpe ?? 0), 0);
  return Math.round((sum / rpeSets.length) * 10) / 10;
}

function buildSessionDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function readCardioExerciseProgress(
  prisma: PrismaService,
  clientId: string,
  query: ExerciseProgressQuery,
): Promise<ExerciseProgressPoint[]> {
  const rows = await prisma.intervalLog.findMany({
    where: {
      sessionCardioBlock: { sourceCardioMethodId: query.exerciseId },
      session: { archivedAt: null, clientId, isCompleted: true, sessionDate: { gte: query.from, lte: query.to } },
    },
    select: { effortRpe: true, durationSecondsDone: true, sessionId: true, session: { select: { sessionDate: true } } },
    orderBy: [{ session: { sessionDate: 'asc' } }],
  });
  type CardioEntry = { sessionDate: Date; totalSecs: number; rpeSum: number; rpeCount: number };
  const bySession = new Map<string, CardioEntry>();
  for (const row of rows) {
    const entry = bySession.get(row.sessionId) ?? {
      sessionDate: row.session.sessionDate,
      totalSecs: 0,
      rpeSum: 0,
      rpeCount: 0,
    };
    entry.totalSecs += row.durationSecondsDone ?? 0;
    if (row.effortRpe !== null) {
      entry.rpeSum += row.effortRpe;
      entry.rpeCount++;
    }
    bySession.set(row.sessionId, entry);
  }
  return [...bySession.entries()].map(([sessionId, { sessionDate, totalSecs, rpeSum, rpeCount }]) => ({
    sessionDate: buildSessionDate(sessionDate),
    sessionId,
    sets: 1,
    totalReps: 0,
    tonnage: 0,
    avgRpe: rpeCount > 0 ? Math.round((rpeSum / rpeCount) * 10) / 10 : null,
    e1rm: null,
    inol: null,
    totalDurationSeconds: totalSecs,
    durationMinutes: Math.round(totalSecs / 60),
    setDetails: [],
  }));
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
    setDetails: [],
  }));
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
  return [...bySession.entries()].map(([sessionId, { sessionDate, sets }]) => ({
    sessionDate: buildSessionDate(sessionDate),
    sessionId,
    sets: sets.length,
    totalReps: 0,
    tonnage: 0,
    avgRpe: avgRpeFromSets(sets),
    e1rm: null,
    inol: null,
    totalDurationSeconds: sets.reduce((acc, r) => acc + (r.durationSecondsDone ?? 0), 0),
    durationMinutes: null,
    setDetails: [],
  }));
}

export async function readSportProgress(
  prisma: PrismaService,
  clientId: string,
  query: ExerciseProgressQuery,
): Promise<ExerciseProgressPoint[]> {
  const rows = await prisma.sportSessionLog.findMany({
    where: {
      sessionSportBlock: { sourceSportId: query.exerciseId },
      session: { archivedAt: null, clientId, isCompleted: true, sessionDate: { gte: query.from, lte: query.to } },
    },
    select: { durationMinutesDone: true, effortRpe: true, sessionId: true, session: { select: { sessionDate: true } } },
    orderBy: [{ session: { sessionDate: 'asc' } }],
  });
  return rows.map((row) => ({
    sessionDate: buildSessionDate(row.session.sessionDate),
    sessionId: row.sessionId,
    sets: 1,
    totalReps: 0,
    tonnage: 0,
    avgRpe: row.effortRpe,
    e1rm: null,
    inol: null,
    totalDurationSeconds: row.durationMinutesDone !== null ? row.durationMinutesDone * 60 : null,
    durationMinutes: row.durationMinutesDone,
    setDetails: [],
  }));
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
