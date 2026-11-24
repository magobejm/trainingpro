import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { ClientRoutine, ClientRoutineWeek as WeekRow, Prisma } from '@prisma/client';
import type { PrismaService } from '../../common/prisma/prisma.service';
import { weekWindow } from './client-routine-view';

type Tx = Prisma.TransactionClient;
export type NeatInput = { description?: null | string; id?: string; title: string };

const clean = (value: null | string | undefined) => {
  const text = value?.trim() ?? '';
  return text.length > 0 ? text : null;
};

/** Makes the NEAT of a copy match the list by position: existing ones are rewritten in place, extras archived. */
async function applyByPosition(tx: Tx, templateId: string, neats: NeatInput[]) {
  const current = await tx.planTemplateNeat.findMany({
    orderBy: { sortOrder: 'asc' },
    where: { archivedAt: null, templateId },
  });
  for (const [position, neat] of neats.entries()) {
    const data = { description: clean(neat.description), sortOrder: position, title: neat.title.trim() };
    const row = current[position];
    if (row) await tx.planTemplateNeat.update({ data, where: { id: row.id } });
    else await tx.planTemplateNeat.create({ data: { ...data, templateId } });
  }
  const extra = current.slice(neats.length).map((row) => row.id);
  if (extra.length) {
    await tx.planTemplateNeat.updateMany({ data: { archivedAt: new Date() }, where: { id: { in: extra } } });
  }
}

/** Rewrites the chosen week by id so the client's marks stay attached to the same NEAT. */
async function applyById(tx: Tx, templateId: string, neats: NeatInput[]) {
  const current = await tx.planTemplateNeat.findMany({ where: { archivedAt: null, templateId } });
  const known = new Set(current.map((row) => row.id));
  const kept = new Set<string>();
  for (const neat of neats) {
    if (neat.id && !known.has(neat.id)) throw new BadRequestException('NEAT does not belong to this week');
    if (neat.id) kept.add(neat.id);
  }
  for (const [position, neat] of neats.entries()) {
    const data = { description: clean(neat.description), sortOrder: position, title: neat.title.trim() };
    if (neat.id) await tx.planTemplateNeat.update({ data, where: { id: neat.id } });
    else await tx.planTemplateNeat.create({ data: { ...data, templateId } });
  }
  const removed = current.filter((row) => !kept.has(row.id)).map((row) => row.id);
  if (removed.length) {
    await tx.planTemplateNeat.updateMany({ data: { archivedAt: new Date() }, where: { id: { in: removed } } });
  }
}

/**
 * Saves the NEAT of one week. The change also applies to the later weeks that are still open and to the
 * client's base copy, which new weeks are cloned from. Finished weeks keep what they had.
 */
export async function saveWeekNeats(
  prisma: PrismaService,
  routine: ClientRoutine & { weeks: WeekRow[] },
  week: WeekRow,
  today: string,
  neats: NeatInput[],
) {
  if (weekWindow(routine, week).to < today) throw new ForbiddenException('This week is closed');
  const later = routine.weeks.filter((item) => item.weekIndex > week.weekIndex && weekWindow(routine, item).to >= today);
  await prisma.$transaction(
    async (tx) => {
      await applyById(tx, week.templateId, neats);
      for (const item of later) await applyByPosition(tx, item.templateId, neats);
      await applyByPosition(tx, routine.baseTemplateId, neats);
    },
    { maxWait: 10_000, timeout: 30_000 },
  );
}
