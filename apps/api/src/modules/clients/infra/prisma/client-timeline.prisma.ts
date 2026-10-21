import { Prisma } from '@prisma/client';
import { sessionOutcome, sessionDateKey } from '@trainerpro/shared';
import { readSessionOrigins } from '../../../../common/plan/session-origins.prisma';
import type { PrismaService } from '../../../../common/prisma/prisma.service';
import { closeStaleSessions } from '../../../sessions/infra/prisma/session-stale';
import {
  isBeforeCursor,
  pageTimeline,
  type TimelineCursor,
  type TimelineDraft,
  type TimelinePage,
} from '../../domain/client-timeline';

const TITLE_LIMIT = 80;

export async function readClientTimeline(
  prisma: PrismaService,
  clientId: string,
  input: { cursor: TimelineCursor; limit: number; includeOutcome?: boolean },
): Promise<TimelinePage> {
  const take = input.limit + 1;
  await closeStaleSessions(prisma, { clientId });
  const sources = await Promise.all([
    readSessions(prisma, clientId, input.cursor, take, input.includeOutcome === true),
    readNotes(prisma, clientId, input.cursor, take),
    readChatDays(prisma, clientId, input.cursor, take),
    readIncidents(prisma, clientId, input.cursor, take),
    readTests(prisma, clientId, input.cursor, take),
    readPhotos(prisma, clientId, input.cursor, take),
  ]);
  return pageTimeline(
    sources.flat().filter((item) => isBeforeCursor(item, input.cursor)),
    input.limit,
  );
}

async function readSessions(
  prisma: PrismaService,
  clientId: string,
  cursor: TimelineCursor,
  take: number,
  includeOutcome: boolean,
): Promise<TimelineDraft[]> {
  const rows = await prisma.sessionInstance.findMany({
    orderBy: [{ sessionDate: 'desc' }, { id: 'desc' }],
    select: {
      id: true,
      isCompleted: true,
      isIncomplete: true,
      planDayTitle: true,
      sessionDate: true,
      sessionRpe: true,
      skipReason: true,
      skippedAt: true,
      status: true,
      planDayId: true,
    },
    take,
    where: {
      AND: [
        {
          archivedAt: null,
          clientId,
          OR: [{ isCompleted: true }, { isIncomplete: true }, { status: 'COMPLETED' }, { skippedAt: { not: null } }],
        },
        sessionCursor(cursor),
      ],
    },
  });
  const tonnage = await readTonnage(
    prisma,
    rows.map((row) => row.id),
  );
  const origins = includeOutcome
    ? await readSessionOrigins(
        prisma,
        rows.map((row) => ({ ...row, clientId })),
      )
    : new Map<string, string | null>();
  return rows.map((row) => ({
    ...(includeOutcome
      ? {
          outcome: sessionOutcome(row),
          sessionDate: sessionDateKey(row.sessionDate),
          originDate: origins.get(row.id) ?? null,
          skipReason: row.skipReason,
        }
      : {}),
    detail: sessionDetail(row, tonnage.get(row.id) ?? null),
    id: row.id,
    kind: 'session',
    occurredAt: row.sessionDate.toISOString(),
    refId: row.id,
    title: row.planDayTitle?.trim() || 'Sesión',
  }));
}

async function readNotes(
  prisma: PrismaService,
  clientId: string,
  cursor: TimelineCursor,
  take: number,
): Promise<TimelineDraft[]> {
  const rows = await prisma.coachNote.findMany({
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: { content: true, createdAt: true, id: true },
    take,
    where: { AND: [{ archivedAt: null, clientId }, beforeCreated(cursor)] },
  });
  return rows.map((row) => ({
    detail: null,
    id: row.id,
    kind: 'note',
    occurredAt: row.createdAt.toISOString(),
    refId: row.id,
    title: clip(row.content),
  }));
}

async function readChatDays(
  prisma: PrismaService,
  clientId: string,
  cursor: TimelineCursor,
  take: number,
): Promise<TimelineDraft[]> {
  const thread = await prisma.chatThread.findFirst({ select: { id: true }, where: { archivedAt: null, clientId } });
  if (!thread) return [];
  const before = cursor ? new Date(cursor.at) : null;
  const rows = await prisma.$queryRaw<Array<{ day: Date; total: number }>>(Prisma.sql`
    SELECT date_trunc('day', created_at) AS day, COUNT(*)::int AS total
    FROM chat_message
    WHERE thread_id = ${thread.id}::uuid
      AND (${before}::timestamptz IS NULL OR date_trunc('day', created_at) <= date_trunc('day', ${before}::timestamptz))
    GROUP BY 1
    ORDER BY 1 DESC
    LIMIT ${take + 1}
  `);
  return rows.map((row) => {
    const day = row.day.toISOString().slice(0, 10);
    return {
      detail: String(row.total),
      id: `chat:${day}`,
      kind: 'chat' as const,
      occurredAt: `${day}T12:00:00.000Z`,
      refId: day,
      title: day,
    };
  });
}

async function readIncidents(
  prisma: PrismaService,
  clientId: string,
  cursor: TimelineCursor,
  take: number,
): Promise<TimelineDraft[]> {
  const rows = await prisma.incident.findMany({
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true, description: true, id: true, reviewedAt: true, severity: true },
    take,
    where: { AND: [{ archivedAt: null, clientId }, beforeCreated(cursor) as Prisma.IncidentWhereInput] },
  });
  return rows.flatMap((row) => {
    const created: TimelineDraft = {
      detail: row.severity,
      id: row.id,
      kind: 'incident',
      occurredAt: row.createdAt.toISOString(),
      refId: row.id,
      title: clip(row.description),
    };
    if (!row.reviewedAt) return [created];
    const reviewed: TimelineDraft = {
      detail: 'reviewed',
      id: `${row.id}:reviewed`,
      kind: 'incident',
      occurredAt: row.reviewedAt.toISOString(),
      refId: row.id,
      title: clip(row.description),
    };
    return [created, reviewed].filter((item) => isBeforeCursor(item, cursor));
  });
}

async function readTests(
  prisma: PrismaService,
  clientId: string,
  cursor: TimelineCursor,
  take: number,
): Promise<TimelineDraft[]> {
  const rows = await prisma.clientPhysicalTestResult.findMany({
    orderBy: [{ measuredAt: 'desc' }, { id: 'desc' }],
    select: { id: true, measuredAt: true, physicalTest: { select: { name: true } }, rawScore: true },
    take,
    where: { AND: [{ clientId }, measuredCursor(cursor)] },
  });
  return rows.map((row) => ({
    detail: row.rawScore,
    id: row.id,
    kind: 'test' as const,
    occurredAt: row.measuredAt.toISOString(),
    refId: row.id,
    title: row.physicalTest.name,
  }));
}

async function readPhotos(
  prisma: PrismaService,
  clientId: string,
  cursor: TimelineCursor,
  take: number,
): Promise<TimelineDraft[]> {
  const rows = await prisma.clientProgressPhoto.findMany({
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: { createdAt: true, id: true },
    take,
    where: { AND: [{ archived: false, clientId }, beforeCreated(cursor) as Prisma.ClientProgressPhotoWhereInput] },
  });
  return rows.map((row) => ({
    detail: null,
    id: row.id,
    kind: 'photo',
    occurredAt: row.createdAt.toISOString(),
    refId: row.id,
    title: '',
  }));
}

async function readTonnage(prisma: PrismaService, sessionIds: string[]): Promise<Map<string, number>> {
  const totals = new Map<string, number>();
  if (!sessionIds.length) return totals;
  const logs = await prisma.setLog.findMany({
    select: { repsDone: true, sessionId: true, weightDoneKg: true },
    where: { sessionId: { in: sessionIds } },
  });
  for (const log of logs) {
    const weight = log.weightDoneKg === null ? null : Number(log.weightDoneKg);
    const reps = log.repsDone;
    if (weight === null || reps === null || !Number.isFinite(weight) || weight < 0 || reps < 0) continue;
    totals.set(log.sessionId, (totals.get(log.sessionId) ?? 0) + weight * reps);
  }
  return totals;
}

function sessionDetail(
  row: {
    isCompleted: boolean;
    isIncomplete: boolean;
    sessionRpe: { toString(): string } | null;
    skipReason: string | null;
    skippedAt: Date | null;
    status: string;
  },
  tonnage: number | null,
): string | null {
  const outcome = sessionOutcome(row);
  const mode = outcome === 'incomplete' || outcome === 'skipped' ? outcome : null;
  const parts = [
    mode,
    mode === 'skipped' ? row.skipReason : null,
    row.sessionRpe === null ? null : `RPE ${row.sessionRpe.toString()}`,
    tonnage !== null ? `${Math.round(tonnage)} kg` : null,
  ].filter((part): part is string => Boolean(part));
  return parts.length ? parts.join(' · ') : null;
}

function sessionCursor(cursor: TimelineCursor): Prisma.SessionInstanceWhereInput {
  if (!cursor) return {};
  const day = new Date(`${cursor.at.slice(0, 10)}T00:00:00.000Z`);
  return {
    OR: [{ sessionDate: { lt: day } }, { id: { lt: cursor.id }, sessionDate: day }],
  };
}

function beforeCreated(cursor: TimelineCursor): Prisma.CoachNoteWhereInput {
  return beforeField<Prisma.CoachNoteWhereInput>(cursor, 'createdAt');
}

function measuredCursor(cursor: TimelineCursor): Prisma.ClientPhysicalTestResultWhereInput {
  return beforeField<Prisma.ClientPhysicalTestResultWhereInput>(cursor, 'measuredAt');
}

function beforeField<T>(cursor: TimelineCursor, field: 'createdAt' | 'measuredAt'): T {
  if (!cursor) return {} as T;
  const at = new Date(cursor.at);
  return { OR: [{ [field]: { lt: at } }, { [field]: at, id: { lt: cursor.id } }] } as T;
}

function clip(value: string): string {
  const trimmed = value.replace(/\s+/g, ' ').trim();
  return trimmed.length <= TITLE_LIMIT ? trimmed : `${trimmed.slice(0, TITLE_LIMIT - 1)}…`;
}
