import { calendarDateKey, countAdherence, expectedMealsOnDate, planCalendarDate, resolvePlanDay } from '@trainerpro/shared';
import type { PrismaService } from '../../../common/prisma/prisma.service';

const THRESHOLD = 80;
const DAYS = 365;

type Plan = { content: unknown; createdAt: Date; type: 'ESTRUCTURADO' | 'LIBRE' };
type MealStatus = 'CHANGED' | 'DONE' | 'SKIPPED';

export async function readNutritionStreakWeeks(
  prisma: PrismaService,
  clientId: string,
  today = new Date(),
): Promise<number> {
  const since = shiftLocalDate(today, -DAYS);
  const [plans, logs] = await Promise.all([
    prisma.nutritionPlan.findMany({
      select: { content: true, createdAt: true, type: true },
      where: { archivedAt: null, clientId },
    }),
    prisma.nutritionMealLog.findMany({
      select: { date: true, status: true },
      where: { clientId, date: { gte: since } },
    }),
  ]);
  return nutritionStreakWeeks(
    plans,
    logs.map((log) => ({ date: log.date.toISOString().slice(0, 10), status: log.status })),
    today,
  );
}

export function nutritionStreakWeeks(plans: Plan[], logs: Array<{ date: string; status: MealStatus }>, today: Date): number {
  const weeks = new Map<string, { expected: number; met: number }>();
  for (let offset = 0; offset < DAYS; offset += 1) {
    const date = shiftLocalDate(today, -offset);
    const key = calendarDateKey(date);
    const expected = plans.reduce((sum, plan) => sum + mealsOn(plan, key), 0);
    const counts = countAdherence(
      expected,
      logs.filter((log) => log.date === key).map((log) => log.status),
    );
    const week = isoWeekKey(date);
    const bucket = weeks.get(week) ?? { expected: 0, met: 0 };
    bucket.expected += counts.expected;
    bucket.met += counts.done + counts.changed;
    weeks.set(week, bucket);
  }
  return walkWeeks(weeks, localDay(today));
}

function mealsOn(plan: Plan, date: string): number {
  const day = resolvePlanDay({ content: plan.content, type: plan.type }, plan.createdAt, planCalendarDate(date));
  return expectedMealsOnDate(plan.createdAt, date, day.meals.length);
}

function walkWeeks(weeks: Map<string, { expected: number; met: number }>, today: Date): number {
  let cursor = startOfIsoWeek(today);
  if ((weekPercent(weeks.get(isoWeekKey(cursor))) ?? -1) < THRESHOLD) cursor = shiftLocalDate(cursor, -7);
  let streak = 0;
  while ((weekPercent(weeks.get(isoWeekKey(cursor))) ?? -1) >= THRESHOLD) {
    streak += 1;
    cursor = shiftLocalDate(cursor, -7);
  }
  return streak;
}

function weekPercent(bucket: { expected: number; met: number } | undefined): number | null {
  if (!bucket || bucket.expected <= 0) return null;
  return Math.round((bucket.met / bucket.expected) * 100);
}

function localDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function shiftLocalDate(date: Date, days: number): Date {
  const next = localDay(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfIsoWeek(date: Date): Date {
  const day = localDay(date);
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  return day;
}

function isoWeekKey(date: Date): string {
  const day = localDay(date);
  day.setDate(day.getDate() + 3 - ((day.getDay() + 6) % 7));
  const jan4 = new Date(day.getFullYear(), 0, 4);
  const week = 1 + Math.round(((day.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7);
  return `${day.getFullYear()}-W${String(week).padStart(2, '0')}`;
}
