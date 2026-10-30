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
      planDay: { templateId: routine.sourceTemplateId },
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
