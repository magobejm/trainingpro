import { resolveLockedFields } from './exercise-set-variables';
export { coachRoutineSchema } from './coach-routine-contract';
export const COACH_BLOCKS = ['strength', 'cardio', 'isometric', 'plio', 'mobility', 'sport'] as const;
export type CoachBlockKind = (typeof COACH_BLOCKS)[number];
export const COACH_BLOCK_ARRAYS: Record<CoachBlockKind, string> = {
  strength: 'exercises',
  cardio: 'cardioBlocks',
  isometric: 'isometricBlocks',
  plio: 'plioBlocks',
  mobility: 'mobilityBlocks',
  sport: 'sportBlocks',
};
export const COACH_LIBRARY_PATHS: Record<CoachBlockKind, string> = {
  strength: 'exercises',
  cardio: 'cardio-methods',
  isometric: 'isometrics',
  plio: 'plyometrics',
  mobility: 'mobility',
  sport: 'sports',
};
export const COACH_LIBRARY_IDS: Record<CoachBlockKind, string> = {
  strength: 'exerciseLibraryId',
  cardio: 'cardioMethodLibraryId',
  isometric: 'isometricExerciseLibraryId',
  plio: 'plioExerciseLibraryId',
  mobility: 'mobilityExerciseLibraryId',
  sport: 'sportLibraryId',
};
export function moveCoachItem<T>(items: T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = items.slice();
  const removed = next.splice(from, 1);
  next.splice(to, 0, ...removed);
  return next;
}
export function normalizeCoachRoutine(value: Record<string, unknown>): Record<string, unknown> {
  return {
    ...value,
    days: ((value.days ?? []) as Record<string, unknown>[]).map((day, index) => ({
      ...day,
      dayIndex: index + 1,
      cardioBlocks:
        (day.cardioBlocks as Record<string, unknown>[] | undefined)?.map((block) => ({
          ...block,
          methodType: block.methodType ?? 'continuo',
        })) ?? [],
      exercises:
        (day.exercises as Record<string, unknown>[] | undefined)?.map((block) => ({
          ...block,
          perSetWeightRanges: block.perSetWeightRanges ?? block.perSetWeightRangesJson ?? [],
        })) ?? [],
      groups:
        (day.groups as Record<string, unknown>[] | undefined)?.map((group) => ({
          ...group,
          clientId: group.clientId ?? group.id,
        })) ?? [],
      warmupTemplateIds:
        day.warmupTemplateIds ?? (day.warmupTemplates as { id: string }[] | undefined)?.map((w) => w.id) ?? [],
    })),
  };
}
export function createCoachBlock(
  kind: CoachBlockKind,
  displayName: string,
  sortOrder: number,
  libraryId?: string,
): Record<string, unknown> {
  const block: Record<string, unknown> = {
    displayName,
    sortOrder,
    fieldModes: [],
    sets: [],
    lockedFields: resolveLockedFields(kind),
    notes: '',
  };
  if (libraryId) block[COACH_LIBRARY_IDS[kind]] = libraryId;
  if (kind === 'strength' || kind === 'isometric') block.setsPlanned = 3;
  if (kind === 'strength')
    block.fieldModes = [
      { fieldKey: 'weightKg', mode: 'CLIENT_INPUT' },
      { fieldKey: 'reps', mode: 'CLIENT_INPUT' },
    ];
  if (['cardio', 'plio', 'mobility'].includes(kind))
    Object.assign(block, { roundsPlanned: 1, workSeconds: 30, restSeconds: 30 });
  if (kind === 'cardio') {
    block.methodType = 'continuo';
    block.fieldModes = [{ fieldKey: 'durationSeconds', mode: 'CLIENT_INPUT' }];
  }
  if (kind === 'sport') block.durationMinutes = 30;
  return block;
}
type FoodMacros = {
  caloriesKcal?: number | null;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
  servingUnit?: string | null;
};
export function nutritionAmountTotals(food: FoodMacros, amount: number) {
  const factor = amount / (food.servingUnit === 'porcion' ? 1 : 100);
  const scale = (value?: number | null) => (value == null ? null : Math.round(value * factor * 100) / 100);
  return {
    caloriesKcal: scale(food.caloriesKcal),
    proteinG: scale(food.proteinG),
    carbsG: scale(food.carbsG),
    fatG: scale(food.fatG),
  };
}
