import { Prisma } from '@prisma/client';
import { microcycleIndex, microcycleStart } from '@trainerpro/shared';
import type { PrismaService } from '../../../../common/prisma/prisma.service';
import { cloneTemplateForClient } from './client-routine-clone';

type Tx = Prisma.TransactionClient;
const WEEK_TX = { maxWait: 10_000, timeout: 30_000 } as const;

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Replaces the client's routine copy. The previous one is archived so its weeks and history stay readable. */
export async function createClientRoutine(
  tx: Tx,
  clientId: string,
  templateId: string | null,
  actorId: string,
  startsOn: string = todayKey(),
) {
  await tx.clientRoutine.updateMany({ where: { clientId, archivedAt: null }, data: { archivedAt: new Date() } });
  if (!templateId) return null;
  const source = await tx.planTemplate.findUniqueOrThrow({
    where: { id: templateId },
    select: { expectedCompletionDays: true, templateVersion: true },
  });
  const baseTemplateId = await cloneTemplateForClient(tx, { actorId, clientId, sourceTemplateId: templateId });
  return tx.clientRoutine.create({
    data: {
      baseTemplateId,
      clientId,
      cycleDays: Math.max(1, source.expectedCompletionDays ?? 7),
      cycleStartsOn: new Date(startsOn),
      sourceTemplateId: templateId,
      sourceTemplateVersion: source.templateVersion,
    },
  });
}

export function activeClientRoutine(db: PrismaService | Tx, clientId: string) {
  return db.clientRoutine.findFirst({ where: { clientId, archivedAt: null }, orderBy: { assignedAt: 'desc' } });
}

/**
 * Which copy of a library plan day the client trains from on a given date: the copy of that
 * microcycle when one exists, otherwise the client's base copy. Null when the client has no copy.
 */
export async function resolveClientDay(
  tx: Tx,
  clientId: string,
  templateId: string,
  planDayId: string,
  sessionDate: Date | string,
): Promise<{ planDayId: string; templateId: string } | null> {
  const routine = await tx.clientRoutine.findFirst({
    where: { archivedAt: null, clientId, sourceTemplateId: templateId },
    include: { weeks: true },
  });
  if (!routine) return null;
  const original = await tx.planDay.findUnique({ where: { id: planDayId }, select: { dayIndex: true } });
  if (!original) return null;
  const date = new Date(sessionDate).toISOString().slice(0, 10);
  const index = microcycleIndex(routine.cycleStartsOn.toISOString().slice(0, 10), date, routine.cycleDays);
  const week = routine.weeks.find((item) => item.weekIndex === index + 1);
  const copyTemplateId = week?.templateId ?? routine.baseTemplateId;
  const day = await tx.planDay.findFirst({
    where: { archivedAt: null, dayIndex: original.dayIndex, revisionVersion: 1, templateId: copyTemplateId },
    select: { id: true },
  });
  return day ? { planDayId: day.id, templateId: copyTemplateId } : null;
}

/**
 * Templates whose plan days the client's calendar can point at: the library routine and the client's base
 * copy, which holds the days the coach added only for this client.
 */
export function clientRoutineTemplateIds(routine: { baseTemplateId: string; sourceTemplateId: string }): string[] {
  return [routine.sourceTemplateId, routine.baseTemplateId];
}

export type RoutineNeat = { description: null | string; id: string; title: string };

/** The template that holds the NEAT of a date: that microcycle's copy, otherwise the client's base copy. */
export function neatTemplateIdFor(
  routine: {
    baseTemplateId: string;
    cycleDays: number;
    cycleStartsOn: Date;
    weeks: Array<{ templateId: string; weekIndex: number }>;
  },
  date: string,
): string {
  const index = microcycleIndex(routine.cycleStartsOn.toISOString().slice(0, 10), date, routine.cycleDays);
  return routine.weeks.find((week) => week.weekIndex === index + 1)?.templateId ?? routine.baseTemplateId;
}

/**
 * The NEAT the client has on a date: the week's copy, then the base copy. Null when the client has no
 * routine copy, so the caller falls back to the library routine.
 */
export async function neatsForDate(db: PrismaService | Tx, clientId: string, date: string): Promise<null | RoutineNeat[]> {
  const routine = await db.clientRoutine.findFirst({
    include: { weeks: { select: { templateId: true, weekIndex: true } } },
    orderBy: { assignedAt: 'desc' },
    where: { archivedAt: null, clientId },
  });
  if (!routine) return null;
  const rows = await db.planTemplateNeat.findMany({
    orderBy: { sortOrder: 'asc' },
    where: { archivedAt: null, templateId: neatTemplateIdFor(routine, date) },
  });
  return rows.map((row) => ({ description: row.description, id: row.id, title: row.title }));
}

/** Every template of the client's active routine that can hold a NEAT. */
export async function clientNeatTemplateIds(db: PrismaService | Tx, clientId: string): Promise<string[]> {
  const routine = await db.clientRoutine.findFirst({
    include: { weeks: { select: { templateId: true } } },
    where: { archivedAt: null, clientId },
  });
  return routine ? [routine.baseTemplateId, ...routine.weeks.map((week) => week.templateId)] : [];
}

/** Sum over the dates of how many NEAT goals the client has each day. Null when there is no routine copy. */
export async function neatGoalDays(
  db: PrismaService | Tx,
  clientId: string,
  fromKey: string,
  toKey: string,
): Promise<null | number> {
  const routine = await db.clientRoutine.findFirst({
    include: { weeks: { select: { templateId: true, weekIndex: true } } },
    where: { archivedAt: null, clientId },
  });
  if (!routine) return null;
  const grouped = await db.planTemplateNeat.groupBy({
    _count: { _all: true },
    by: ['templateId'],
    where: {
      archivedAt: null,
      templateId: { in: [routine.baseTemplateId, ...routine.weeks.map((week) => week.templateId)] },
    },
  });
  const counts = new Map(grouped.map((row) => [row.templateId, row._count._all]));
  let total = 0;
  for (let ms = Date.parse(`${fromKey}T00:00:00Z`); ms <= Date.parse(`${toKey}T00:00:00Z`); ms += 86_400_000) {
    total += counts.get(neatTemplateIdFor(routine, new Date(ms).toISOString().slice(0, 10))) ?? 0;
  }
  return total;
}

/**
 * One week copy per microcycle that has workouts planned in the calendar.
 * Existing weeks are never replaced or removed, so logged progress stays attached.
 */
export async function syncClientRoutineWeeks(prisma: PrismaService, clientId: string, actorId: string) {
  const routine = await activeClientRoutine(prisma, clientId);
  if (!routine) return null;
  const start = routine.cycleStartsOn.toISOString().slice(0, 10);
  const events = await prisma.calendarEvent.findMany({
    where: {
      archivedAt: null,
      clientId,
      date: { gte: routine.cycleStartsOn },
      planDay: { templateId: { in: clientRoutineTemplateIds(routine) } },
      type: 'workout',
    },
    select: { date: true },
  });
  const wanted = new Set(
    events.map((event) => microcycleIndex(start, event.date.toISOString().slice(0, 10), routine.cycleDays)),
  );
  const existing = new Set(
    (
      await prisma.clientRoutineWeek.findMany({
        where: { clientRoutineId: routine.id },
        select: { weekIndex: true },
      })
    ).map((week) => week.weekIndex - 1),
  );
  for (const index of [...wanted].sort((a, b) => a - b)) {
    if (existing.has(index)) continue;
    await prisma
      .$transaction(async (tx) => {
        const templateId = await cloneTemplateForClient(tx, { actorId, clientId, sourceTemplateId: routine.baseTemplateId });
        await tx.clientRoutineWeek.create({
          data: {
            clientRoutineId: routine.id,
            startsOn: new Date(microcycleStart(start, index, routine.cycleDays)),
            templateId,
            weekIndex: index + 1,
          },
        });
      }, WEEK_TX)
      .catch((error: unknown) => {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) throw error;
      });
  }
  return routine;
}
