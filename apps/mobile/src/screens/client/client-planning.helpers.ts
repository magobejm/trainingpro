import type { ClientRoutineDay, ClientRoutineExercise } from '../../data/hooks/useClientRoutineQuery';

export type ExerciseType = ClientRoutineExercise['type'];

export type TypeCount = {
  type: ExerciseType;
  count: number;
};

export type DayTypeStats = {
  total: number;
  dominantType: ExerciseType | null;
  byType: TypeCount[];
};

export const TYPE_BADGE: Record<ExerciseType, { bg: string; label: string; text: string }> = {
  cardio: { bg: 'rgba(59,130,246,0.18)', label: 'Cardio', text: '#60a5fa' },
  isometric: { bg: 'rgba(251,146,60,0.18)', label: 'Isométrico', text: '#fb923c' },
  mobility: { bg: 'rgba(52,211,153,0.18)', label: 'Movilidad', text: '#34d399' },
  plio: { bg: 'rgba(250,204,21,0.18)', label: 'Pliométrico', text: '#facc15' },
  sport: { bg: 'rgba(167,139,250,0.18)', label: 'Deporte', text: '#a78bfa' },
  strength: { bg: 'rgba(236,72,153,0.18)', label: 'Fuerza', text: '#ec4899' },
};

const TYPE_ORDER: ExerciseType[] = ['strength', 'cardio', 'plio', 'mobility', 'isometric', 'sport'];

export function computeDayTypeStats(day: ClientRoutineDay): DayTypeStats {
  const counter = new Map<ExerciseType, number>();
  for (const ex of day.exercises) {
    counter.set(ex.type, (counter.get(ex.type) ?? 0) + 1);
  }
  const byType: TypeCount[] = TYPE_ORDER.filter((t) => counter.has(t)).map((t) => ({
    type: t,
    count: counter.get(t) ?? 0,
  }));
  let dominantType: ExerciseType | null = null;
  let dominantCount = 0;
  for (const tc of byType) {
    if (tc.count > dominantCount) {
      dominantType = tc.type;
      dominantCount = tc.count;
    }
  }
  return { total: day.exercises.length, dominantType, byType };
}

export function aggregateMicrocycleTypes(days: ClientRoutineDay[]): TypeCount[] {
  const counter = new Map<ExerciseType, number>();
  for (const day of days) {
    for (const ex of day.exercises) {
      counter.set(ex.type, (counter.get(ex.type) ?? 0) + 1);
    }
  }
  return TYPE_ORDER.filter((t) => counter.has(t)).map((t) => ({ type: t, count: counter.get(t) ?? 0 }));
}

export type WeekSlot = {
  weekdayIndex: number;
  day: ClientRoutineDay | null;
};

export function buildWeekSlots(days: ClientRoutineDay[], cycleLength: number): WeekSlot[] {
  const totalSlots = Math.max(7, Math.min(cycleLength, 14));
  const slots: WeekSlot[] = [];
  for (let i = 0; i < totalSlots; i++) {
    const matchedDay = days.find((d) => d.dayIndex - 1 === i) ?? null;
    slots.push({ weekdayIndex: i, day: matchedDay });
  }
  return slots;
}
