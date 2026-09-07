export type PlanDayRef = {
  dayIndex: number;
  id: string;
  title: string;
};

export type CalendarEventRef = {
  planDayId: string | null;
  title: string | null;
};

const DAY_INDEX_TITLE = /\b(?:d[ií]a|day)\s*(\d+)\b/i;

export function parseDayIndexFromCalendarTitle(title: string): number | null {
  const match = title.trim().match(DAY_INDEX_TITLE);
  if (!match?.[1]) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function resolvePlanDayIdFromCalendarEvent(event: CalendarEventRef, planDays: PlanDayRef[]): string | null {
  if (event.planDayId) {
    const byId = planDays.find((day) => day.id === event.planDayId);
    if (byId) return byId.id;
  }

  const title = event.title?.trim();
  if (!title) return event.planDayId;

  const exact = planDays.find((day) => day.title === title);
  if (exact) return exact.id;

  const partial = planDays.find((day) => title.includes(day.title) || day.title.includes(title));
  if (partial) return partial.id;

  const dayIndex = parseDayIndexFromCalendarTitle(title);
  if (dayIndex != null) {
    const byIndex = planDays.find((day) => day.dayIndex === dayIndex);
    if (byIndex) return byIndex.id;
  }

  return event.planDayId;
}

export function findPlanDayFromCalendarEvent(event: CalendarEventRef, planDays: PlanDayRef[]): PlanDayRef | null {
  const id = resolvePlanDayIdFromCalendarEvent(event, planDays);
  if (!id) return null;
  return planDays.find((day) => day.id === id) ?? null;
}
