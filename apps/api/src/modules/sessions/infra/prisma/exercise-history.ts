import type { Prisma } from '@prisma/client';
import type { ExerciseHistorySet } from '@trainerpro/shared';
import type { ExerciseHistoryEntry } from '../../domain/session.entity';

export function exerciseHistoryQuery(clientId: string, sourceId: string, limit: number, excludeSessionId?: string) {
  const strength = { archivedAt: null, sourceExerciseId: sourceId, logs: { some: {} } };
  const cardio = { archivedAt: null, sourceCardioMethodId: sourceId, intervalLogs: { some: {} } };
  const plio = { archivedAt: null, sourcePlioExerciseId: sourceId, logs: { some: {} } };
  const mobility = { archivedAt: null, sourceMobilityExerciseId: sourceId, logs: { some: {} } };
  const isometric = { archivedAt: null, sourceIsometricExerciseId: sourceId, logs: { some: {} } };
  const sport = { archivedAt: null, sourceSportId: sourceId, OR: [{ setLogs: { some: {} } }, { logs: { some: {} } }] };
  const logs = { orderBy: { setIndex: 'asc' as const } };
  return {
    where: {
      clientId,
      archivedAt: null,
      status: 'COMPLETED' as const,
      ...(excludeSessionId ? { id: { not: excludeSessionId } } : {}),
      OR: [
        { items: { some: strength } },
        { cardioBlocks: { some: cardio } },
        { plioBlocks: { some: plio } },
        { mobilityBlocks: { some: mobility } },
        { isometricBlocks: { some: isometric } },
        { sportBlocks: { some: sport } },
      ],
    },
    orderBy: [{ sessionDate: 'desc' as const }, { finishedAt: 'desc' as const }, { id: 'desc' as const }],
    take: limit,
    include: {
      items: { where: strength, orderBy: { sortOrder: 'asc' as const }, include: { logs } },
      cardioBlocks: {
        where: cardio,
        orderBy: { sortOrder: 'asc' as const },
        include: { intervalLogs: { orderBy: { intervalIndex: 'asc' as const } } },
      },
      plioBlocks: { where: plio, orderBy: { sortOrder: 'asc' as const }, include: { logs } },
      mobilityBlocks: { where: mobility, orderBy: { sortOrder: 'asc' as const }, include: { logs } },
      isometricBlocks: { where: isometric, orderBy: { sortOrder: 'asc' as const }, include: { logs } },
      sportBlocks: { where: sport, orderBy: { sortOrder: 'asc' as const }, include: { setLogs: logs, logs: true } },
    },
  } satisfies Prisma.SessionInstanceFindManyArgs;
}

type HistoryRow = Prisma.SessionInstanceGetPayload<ReturnType<typeof exerciseHistoryQuery>>;
type ActualLog = { setIndex?: number; intervalIndex?: number; [field: string]: unknown };
const numericFields = [
  'repsDone',
  'weightDoneKg',
  'effortRpe',
  'effortRir',
  'durationSecondsDone',
  'distanceDoneMeters',
  'heartRateDone',
  'hrMaxPctDone',
  'hrReservePctDone',
  'restSecondsDone',
] as const;

function mapActualSet(itemId: string, log: ActualLog): ExerciseHistorySet {
  const set: ExerciseHistorySet = { itemId, setIndex: log.setIndex ?? log.intervalIndex ?? 1 };
  for (const field of numericFields) {
    const value = field === 'heartRateDone' ? (log.heartRateDone ?? log.avgHeartRate) : log[field];
    if (value != null) set[field] = Number(value);
  }
  if (log.romDone != null) set.romDone = String(log.romDone);
  return set;
}

export function mapExerciseHistory(row: HistoryRow): ExerciseHistoryEntry {
  const sets = [...row.items, ...row.plioBlocks, ...row.mobilityBlocks, ...row.isometricBlocks].flatMap((block) =>
    block.logs.map((log) => mapActualSet(block.id, log)),
  );
  sets.push(...row.cardioBlocks.flatMap((block) => block.intervalLogs.map((log) => mapActualSet(block.id, log))));
  for (const block of row.sportBlocks) {
    if (block.setLogs.length) sets.push(...block.setLogs.map((log) => mapActualSet(block.id, log)));
    else
      sets.push(
        ...block.logs.map((log) =>
          mapActualSet(block.id, {
            ...log,
            durationSecondsDone: log.durationMinutesDone == null ? null : log.durationMinutesDone * 60,
          }),
        ),
      );
  }
  const last = sets.at(-1);
  return {
    sessionId: row.id,
    sessionDate: row.sessionDate,
    sets,
    effortRir: last?.effortRir ?? null,
    effortRpe: last?.effortRpe ?? null,
    repsDone: last?.repsDone ?? null,
    weightDoneKg: last?.weightDoneKg ?? null,
  };
}
