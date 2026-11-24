import { ConflictException, NotFoundException } from '@nestjs/common';
import type { ClientRoutine, ClientRoutineWeek as WeekRow } from '@prisma/client';
import type { PrismaService } from '../../common/prisma/prisma.service';
import { weekWindow } from './client-routine-view';

type Routine = ClientRoutine & { weeks: WeekRow[] };

/** Templates of the client's copy that are still open: the base copy and the weeks that have not ended. */
function openTemplateIds(routine: Routine, today: string): string[] {
  return [
    routine.baseTemplateId,
    ...routine.weeks.filter((week) => weekWindow(routine, week).to >= today).map((week) => week.templateId),
  ];
}

function copyTemplateIds(routine: Routine): string[] {
  return [routine.baseTemplateId, ...routine.weeks.map((week) => week.templateId)];
}

/** Day indexes the library routine uses (any version). The client's own days never reuse them. */
export async function libraryDayIndexes(prisma: PrismaService, routine: Pick<ClientRoutine, 'sourceTemplateId'>) {
  const rows = await prisma.planDay.findMany({
    distinct: ['dayIndex'],
    select: { dayIndex: true },
    where: { templateId: routine.sourceTemplateId },
  });
  return new Set(rows.map((row) => row.dayIndex));
}

/** Adds a day of the coach's own to the base copy and every week that is still open. */
export async function addClientDay(prisma: PrismaService, routine: Routine, today: string, title: string) {
  const last = await prisma.planDay.aggregate({
    _max: { dayIndex: true },
    where: { templateId: { in: [routine.sourceTemplateId, ...copyTemplateIds(routine)] } },
  });
  const dayIndex = (last._max.dayIndex ?? -1) + 1;
  await prisma.$transaction(
    async (tx) => {
      for (const templateId of openTemplateIds(routine, today)) {
        await tx.planDay.create({ data: { dayIndex, revisionVersion: 1, templateId, title: title.trim() } });
      }
    },
    { maxWait: 10_000, timeout: 30_000 },
  );
  return dayIndex;
}

/** Finds the client's own day by the id it has in any copy, and the same day in the open copies. */
async function ownDay(prisma: PrismaService, routine: Routine, today: string, dayId: string) {
  const day = await prisma.planDay.findFirst({
    select: { dayIndex: true },
    where: { archivedAt: null, id: dayId, templateId: { in: copyTemplateIds(routine) } },
  });
  if (!day) throw new NotFoundException('Day not found');
  if ((await libraryDayIndexes(prisma, routine)).has(day.dayIndex)) {
    throw new ConflictException('Days of the library routine cannot be renamed or deleted here');
  }
  const open = await prisma.planDay.findMany({
    select: { id: true },
    where: {
      archivedAt: null,
      dayIndex: day.dayIndex,
      revisionVersion: 1,
      templateId: { in: openTemplateIds(routine, today) },
    },
  });
  return { dayIndex: day.dayIndex, openIds: open.map((item) => item.id) };
}

export async function renameClientDay(prisma: PrismaService, routine: Routine, today: string, dayId: string, title: string) {
  const { openIds } = await ownDay(prisma, routine, today, dayId);
  await prisma.planDay.updateMany({ data: { title: title.trim() }, where: { id: { in: openIds } } });
}

/** Archives the day in the open copies. It is refused once it was scheduled or trained. */
export async function removeClientDay(prisma: PrismaService, routine: Routine, today: string, dayId: string) {
  const { dayIndex, openIds } = await ownDay(prisma, routine, today, dayId);
  const copyDays = await prisma.planDay.findMany({
    select: { id: true },
    where: { dayIndex, revisionVersion: 1, templateId: { in: copyTemplateIds(routine) } },
  });
  const ids = copyDays.map((item) => item.id);
  const [events, sessions] = await Promise.all([
    prisma.calendarEvent.count({ where: { archivedAt: null, clientId: routine.clientId, planDayId: { in: ids } } }),
    prisma.sessionInstance.count({
      where: {
        archivedAt: null,
        clientId: routine.clientId,
        OR: [{ planDayId: { in: ids } }, { planDayIndex: dayIndex, sourceTemplateId: routine.sourceTemplateId }],
      },
    }),
  ]);
  if (events > 0 || sessions > 0) {
    throw new ConflictException('This day is scheduled or already trained, so it cannot be deleted');
  }
  await prisma.planDay.updateMany({ data: { archivedAt: new Date() }, where: { id: { in: openIds } } });
}
