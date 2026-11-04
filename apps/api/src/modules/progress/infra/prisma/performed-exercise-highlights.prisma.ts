import type { Prisma } from '@prisma/client';
import type { PrismaService } from '../../../../common/prisma/prisma.service';
import { highlightsFromSets, type HighlightInput } from '../../domain/metrics/performed-highlights';
import type { PerformedExerciseItem, PerformedExercisesResult } from '../../domain/progress.models';
import { closedSessionWhere } from './closed-session';

type LoggedBlock = {
  exerciseId: string | null;
  sessionId: string;
  logs: { weightDoneKg: Prisma.Decimal | number | null; repsDone?: number | null }[];
};

function sessionFilter(clientId: string, from: Date, to: Date): Prisma.SessionInstanceWhereInput {
  return { clientId, archivedAt: null, ...closedSessionWhere, sessionDate: { gte: from, lte: to } };
}

function rowsOf(blocks: LoggedBlock[]): HighlightInput[] {
  return blocks.flatMap((block) => {
    if (!block.exerciseId) return [];
    const present = block.logs.map((log) => ({
      exerciseId: block.exerciseId as string,
      sessionId: block.sessionId,
      weightKg: log.weightDoneKg === null ? null : Number(log.weightDoneKg),
      reps: log.repsDone ?? null,
    }));
    return present.length
      ? present
      : [{ exerciseId: block.exerciseId, sessionId: block.sessionId, weightKg: null, reps: null }];
  });
}

async function loadRows(prisma: PrismaService, clientId: string, from: Date, to: Date): Promise<HighlightInput[]> {
  const session = sessionFilter(clientId, from, to);
  const [strength, cardio, plio, mobility, isometric, sport] = await Promise.all([
    prisma.sessionStrengthItem.findMany({
      where: { archivedAt: null, session },
      select: { sourceExerciseId: true, sessionId: true, logs: { select: { weightDoneKg: true, repsDone: true } } },
    }),
    prisma.sessionCardioBlock.findMany({
      where: { archivedAt: null, session },
      select: { sourceCardioMethodId: true, sessionId: true },
    }),
    prisma.sessionPlioBlock.findMany({
      where: { archivedAt: null, session },
      select: { sourcePlioExerciseId: true, sessionId: true, logs: { select: { weightDoneKg: true, repsDone: true } } },
    }),
    prisma.sessionMobilityBlock.findMany({
      where: { archivedAt: null, session },
      select: { sourceMobilityExerciseId: true, sessionId: true },
    }),
    prisma.sessionIsometricBlock.findMany({
      where: { archivedAt: null, session },
      select: { sourceIsometricExerciseId: true, sessionId: true, logs: { select: { weightDoneKg: true } } },
    }),
    prisma.sessionSportBlock.findMany({
      where: { archivedAt: null, session },
      select: { sourceSportId: true, sessionId: true, setLogs: { select: { weightDoneKg: true, repsDone: true } } },
    }),
  ]);
  return [
    ...rowsOf(strength.map((row) => ({ exerciseId: row.sourceExerciseId, sessionId: row.sessionId, logs: row.logs }))),
    ...rowsOf(cardio.map((row) => ({ exerciseId: row.sourceCardioMethodId, sessionId: row.sessionId, logs: [] }))),
    ...rowsOf(plio.map((row) => ({ exerciseId: row.sourcePlioExerciseId, sessionId: row.sessionId, logs: row.logs }))),
    ...rowsOf(mobility.map((row) => ({ exerciseId: row.sourceMobilityExerciseId, sessionId: row.sessionId, logs: [] }))),
    ...rowsOf(
      isometric.map((row) => ({ exerciseId: row.sourceIsometricExerciseId, sessionId: row.sessionId, logs: row.logs })),
    ),
    ...rowsOf(sport.map((row) => ({ exerciseId: row.sourceSportId, sessionId: row.sessionId, logs: row.setLogs }))),
  ];
}

function apply(items: PerformedExerciseItem[], highlights: ReturnType<typeof highlightsFromSets>): PerformedExerciseItem[] {
  return items.map((item) => ({ ...item, ...(highlights.get(item.id) ?? {}) }));
}

export async function withPerformedHighlights(
  prisma: PrismaService,
  clientId: string,
  from: Date,
  to: Date,
  catalog: PerformedExercisesResult,
): Promise<PerformedExercisesResult> {
  const highlights = highlightsFromSets(await loadRows(prisma, clientId, from, to));
  return {
    strength: apply(catalog.strength, highlights),
    cardio: apply(catalog.cardio, highlights),
    plio: apply(catalog.plio, highlights),
    mobility: apply(catalog.mobility, highlights),
    isometric: apply(catalog.isometric, highlights),
    sport: apply(catalog.sport, highlights),
  };
}
