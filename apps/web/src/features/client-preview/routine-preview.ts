import type { ClientRoutine, ClientRoutineExercise, ClientRoutineSet } from '@trainerpro/shared';
import type { DraftBlock, DraftSet, DraftState } from '../../screens/coach/RoutinePlanner.types';

export type PreviewLibraryItem = {
  id: string;
  instructions?: null | string;
  coachInstructions?: null | string;
  description?: null | string;
  media?: { url: null | string };
  mediaUrl?: null | string;
  youtubeUrl?: null | string;
};
export type PreviewLibrary = Partial<Record<DraftBlock['type'], PreviewLibraryItem[]>>;

export function buildRoutinePreview(draft: DraftState, library: PreviewLibrary = {}): ClientRoutine {
  return {
    id: draft.sourcePlanTemplateId ?? 'preview',
    name: draft.name,
    objectives: [],
    expectedCompletionDays: draft.expectedCompletionDays ?? null,
    neats: draft.neats?.map((neat) => ({ ...neat, description: neat.description ?? null })),
    planDays: draft.days.map((day, index) => ({
      id: day.id,
      title: day.title,
      dayIndex: index + 1,
      notes: day.notes ?? null,
      exercises: day.blocks.map((block, order) => {
        const item = library[block.type]?.find((entry) => entry.id === block.libraryId);
        const bounds = block.repsRange?.split(/[-–]/).map(Number).filter(Number.isFinite) ?? [];
        return {
          id: block.id,
          displayName: block.displayName,
          type: block.type,
          sortOrder: block.sortOrder ?? order,
          groupId: block.groupId ?? null,
          groupType: day.groups?.find((group) => group.id === block.groupId)?.groupType ?? null,
          lockedFields: block.lockedFields,
          notes: block.notes ?? null,
          coachInstructions: item?.coachInstructions ?? null,
          mediaUrl: item?.media?.url ?? item?.mediaUrl ?? null,
          youtubeUrl: item?.youtubeUrl ?? null,
          repsMin: bounds[0] ?? block.repsPlanned ?? null,
          repsMax: bounds[1] ?? bounds[0] ?? block.repsPlanned ?? null,
          restSeconds: block.restSeconds ?? null,
          setsPlanned: block.setsPlanned ?? block.roundsPlanned ?? block.sets?.length ?? null,
          targetRir: block.targetRir ?? null,
          targetRpe: block.targetRpe ?? null,
          sets: previewSets(block),
        } satisfies ClientRoutineExercise;
      }),
    })),
  };
}

function csv(value: string | undefined, index: number): number | undefined {
  const entry = value?.split(',')[index]?.trim();
  return entry && Number.isFinite(Number(entry)) ? Number(entry) : undefined;
}

function previewSets(block: DraftBlock): ClientRoutineSet[] {
  const sets: DraftSet[] = block.sets?.length
    ? block.sets
    : Array.from({ length: block.setsPlanned ?? block.roundsPlanned ?? 0 }, (_, setIndex) => ({ setIndex }));
  const bounds =
    block.repsRange
      ?.split(/[-\u2013]/)
      .map(Number)
      .filter(Number.isFinite) ?? [];
  return [...sets]
    .sort((left, right) => left.setIndex - right.setIndex)
    .map((set) => ({
      ...set,
      note: set.note ?? null,
      advancedTechnique: set.advancedTechnique ?? null,
      reps: set.reps ?? csv(block.repsPerSeries, set.setIndex) ?? block.repsPlanned ?? bounds[1] ?? bounds[0] ?? null,
      weightKg: set.weightKg ?? csv(block.weightPerSeriesKg, set.setIndex) ?? block.weightKg ?? null,
      restSeconds: set.restSeconds ?? block.restSeconds ?? null,
      rir: set.rir ?? block.targetRir ?? null,
      rpe: set.rpe ?? block.targetRpe ?? null,
      fcMaxPct: set.fcMaxPct ?? block.intensityFcMax ?? null,
      fcReservePct: set.fcReservePct ?? block.intensityFcReserve ?? null,
      heartRate: set.heartRate ?? block.heartRate ?? null,
    }));
}
