const BLOCK_KEYS = ['exercises', 'cardioBlocks', 'plioBlocks', 'mobilityBlocks', 'isometricBlocks', 'sportBlocks'] as const;

export type PublishedDay = {
  cardioBlocks?: unknown;
  dayIndex: number;
  exercises?: unknown;
  isometricBlocks?: unknown;
  mobilityBlocks?: unknown;
  plioBlocks?: unknown;
  sportBlocks?: unknown;
  title?: null | string;
};

export type PublishedNeat = { description?: null | string; id?: string; title?: null | string };

export type PublishedRoutine = {
  days: PublishedDay[];
  expectedCompletionDays: null | number;
  name: string;
  neats: PublishedNeat[];
};

type RoutineSource = {
  days?: unknown;
  expectedCompletionDays?: null | number;
  name?: null | string;
  neats?: unknown;
};

/** The published revision, or null when the client has no routine. */
export function readPublishedRoutine(value: RoutineSource | null): PublishedRoutine | null {
  const name = value?.name?.trim();
  if (!value || !name) return null;
  return {
    days: Array.isArray(value.days) ? value.days.filter(isDay) : [],
    expectedCompletionDays: typeof value.expectedCompletionDays === 'number' ? value.expectedCompletionDays : null,
    name,
    neats: Array.isArray(value.neats) ? value.neats.filter(isNeat) : [],
  };
}

export function planningSummary(routine: PublishedRoutine | null): { days: number; name: string } | null {
  if (!routine) return null;
  return { days: routine.days.length, name: routine.name };
}

/** Names of every block on the day, in the order the routine stores them. */
export function dayExerciseNames(day: PublishedDay): string[] {
  return BLOCK_KEYS.flatMap((key) => namesOf(day[key]));
}

export type WeekSlot = { day: PublishedDay | null; weekdayIndex: number };

/** Slots of the microcycle. A day lands on dayIndex - 1; missing slots are rest. */
export function buildWeekSlots(days: PublishedDay[], expectedCompletionDays: null | number): WeekSlot[] {
  const cycleLength = expectedCompletionDays ?? 7;
  const totalSlots = Math.max(7, Math.min(cycleLength, 14));
  return Array.from({ length: totalSlots }, (_, weekdayIndex) => ({
    day: days.find((item) => item.dayIndex - 1 === weekdayIndex) ?? null,
    weekdayIndex,
  }));
}

function namesOf(blocks: unknown): string[] {
  if (!Array.isArray(blocks)) return [];
  return blocks.flatMap((block) => {
    if (!block || typeof block !== 'object') return [];
    const name = (block as { displayName?: unknown }).displayName;
    return typeof name === 'string' && name.trim() ? [name.trim()] : [];
  });
}

function isDay(value: unknown): value is PublishedDay {
  return Boolean(value && typeof value === 'object' && typeof (value as PublishedDay).dayIndex === 'number');
}

function isNeat(value: unknown): value is PublishedNeat {
  if (!value || typeof value !== 'object') return false;
  const title = (value as PublishedNeat).title;
  return typeof title === 'string' && title.trim().length > 0;
}
