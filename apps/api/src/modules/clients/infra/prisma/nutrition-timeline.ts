import { calendarDateKey, countAdherence, expectedMealsOnDate, planCalendarDate, resolvePlanDay } from '@trainerpro/shared';
import type { PrismaService } from '../../../../common/prisma/prisma.service';
import type { TimelineDraft } from '../../domain/client-timeline';

type MealStatus = 'CHANGED' | 'DONE' | 'SKIPPED';
type DayLog = { comment: string | null; status: MealStatus };

export async function readNutritionTimeline(
  prisma: PrismaService,
  clientId: string,
  take: number,
): Promise<TimelineDraft[]> {
  const [logs, plans] = await Promise.all([
    prisma.nutritionMealLog.findMany({
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
      select: { comment: true, date: true, status: true },
      take: 400,
      where: { clientId },
    }),
    prisma.nutritionPlan.findMany({
      select: { content: true, createdAt: true, type: true },
      where: { archivedAt: null, clientId },
    }),
  ]);
  const grouped = new Map<string, DayLog[]>();
  for (const log of logs) {
    const date = log.date.toISOString().slice(0, 10);
    grouped.set(date, [...(grouped.get(date) ?? []), { comment: log.comment, status: log.status }]);
  }
  const today = calendarDateKey(new Date());
  return [...grouped.entries()]
    .filter(([date]) => date <= today)
    .slice(0, take)
    .map(([date, dayLogs]) => toDraft(clientId, date, plans, dayLogs));
}

function toDraft(
  clientId: string,
  date: string,
  plans: Array<{ content: unknown; createdAt: Date; type: 'ESTRUCTURADO' | 'LIBRE' }>,
  dayLogs: DayLog[],
): TimelineDraft {
  const expected = plans.reduce((sum, plan) => {
    const day = resolvePlanDay({ content: plan.content, type: plan.type }, plan.createdAt, planCalendarDate(date));
    return sum + expectedMealsOnDate(plan.createdAt, date, day.meals.length);
  }, 0);
  const summary = countAdherence(
    expected,
    dayLogs.map((log) => log.status),
  );
  const comments = dayLogs.flatMap((log) => (log.comment ? [log.comment] : []));
  return {
    detail: comments.length > 0 ? comments.join(' · ') : null,
    id: `nutrition-${clientId}-${date}`,
    kind: 'nutrition',
    occurredAt: `${date}T12:00:00.000Z`,
    refId: date,
    title: nutritionTitle(summary.done + summary.changed, summary.expected, summary.changed),
  };
}

function nutritionTitle(met: number, expected: number, changed: number): string {
  const base = `${met} de ${expected} comidas cumplidas`;
  if (changed === 0) return base;
  return `${base} (${changed} ${changed === 1 ? 'cambiada' : 'cambiadas'})`;
}
