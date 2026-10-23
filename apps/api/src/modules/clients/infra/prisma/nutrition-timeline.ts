import { countAdherence, planCalendarDate, resolvePlanDay } from '@trainerpro/shared';
import type { PrismaService } from '../../../../common/prisma/prisma.service';
import type { TimelineDraft } from '../../domain/client-timeline';

export async function readNutritionTimeline(
  prisma: PrismaService,
  clientId: string,
  take: number,
): Promise<TimelineDraft[]> {
  const [logs, plans] = await Promise.all([
    prisma.nutritionMealLog.findMany({
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
      select: { date: true, status: true },
      take: 400,
      where: { clientId },
    }),
    prisma.nutritionPlan.findMany({
      select: { content: true, createdAt: true, type: true },
      where: { archivedAt: null, clientId },
    }),
  ]);
  const grouped = new Map<string, Array<'CHANGED' | 'DONE' | 'SKIPPED'>>();
  for (const log of logs) {
    const date = log.date.toISOString().slice(0, 10);
    grouped.set(date, [...(grouped.get(date) ?? []), log.status]);
  }
  return [...grouped.entries()].slice(0, take).map(([date, statuses]) => toDraft(clientId, date, plans, statuses));
}

function toDraft(
  clientId: string,
  date: string,
  plans: Array<{ content: unknown; createdAt: Date; type: 'ESTRUCTURADO' | 'LIBRE' }>,
  statuses: Array<'CHANGED' | 'DONE' | 'SKIPPED'>,
): TimelineDraft {
  const expected = plans.reduce((sum, plan) => {
    const day = resolvePlanDay({ content: plan.content, type: plan.type }, plan.createdAt, planCalendarDate(date));
    return sum + day.meals.length;
  }, 0);
  const summary = countAdherence(expected, statuses);
  return {
    detail: null,
    id: `nutrition-${clientId}-${date}`,
    kind: 'nutrition',
    occurredAt: `${date}T12:00:00.000Z`,
    refId: date,
    title: `${summary.done} de ${summary.expected} comidas hechas`,
  };
}
