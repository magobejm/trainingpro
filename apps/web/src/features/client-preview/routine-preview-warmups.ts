import type { DraftState } from '../../screens/coach/RoutinePlanner.types';
import type { WarmupTemplateView } from '../../data/hooks/useWarmupTemplates';
import { mapWarmupTemplateItemsToBlocks } from '../../screens/coach/RoutinePlanner.template-mapper';
import { buildRoutinePreview, type PreviewLibrary } from './routine-preview';
import type { ClientRoutine, ClientRoutineExercise, ClientRoutineWarmup } from '@trainerpro/shared';

type Warmup = Pick<WarmupTemplateView, 'id' | 'name' | 'items' | 'groups'>;

export function unavailablePreviewWarmups(draft: DraftState, warmups: Warmup[]): string[] {
  const available = new Set(warmups.map((entry) => entry.id));
  return [
    ...new Set(
      draft.days.flatMap((day) =>
        (day.warmupTemplates ?? []).filter((reference) => !available.has(reference.id)).map((reference) => reference.name),
      ),
    ),
  ];
}

export function resolvePreviewWarmups(draft: DraftState, warmups: Warmup[]): DraftState {
  return {
    ...draft,
    days: draft.days.map((day) => {
      let counter = 0;
      const groups = [...(day.groups ?? [])];
      const blocks = (day.warmupTemplates ?? []).flatMap((reference) => {
        const template = warmups.find((entry) => entry.id === reference.id);
        if (!template) return [];
        groups.push(
          ...template.groups.map((group) => ({
            ...group,
            id: `preview-${reference.id}-${group.id}`,
            groupType: 'CIRCUIT' as const,
            note: group.note ?? undefined,
          })),
        );
        return mapWarmupTemplateItemsToBlocks(
          template.items,
          (type, displayName) => ({ id: '', type, displayName }),
          () => `preview-warmup-${reference.id}-${counter++}`,
        ).map((block) => ({
          ...block,
          sortOrder: -10000 + counter++,
          groupId: block.groupId ? `preview-${reference.id}-${block.groupId}` : undefined,
        }));
      });
      return { ...day, groups, blocks: [...blocks, ...day.blocks] };
    }),
  };
}

export function buildRoutineClientPreview(
  draft: DraftState,
  warmups: Warmup[],
  library: PreviewLibrary = {},
): ClientRoutine {
  const routine = buildRoutinePreview(draft, library);
  return {
    ...routine,
    planDays: routine.planDays.map((day, index) => {
      const draftDay = draft.days[index];
      const dayWarmups: ClientRoutineWarmup[] = (draftDay?.warmupTemplates ?? []).flatMap((reference) => {
        const template = warmups.find((entry) => entry.id === reference.id);
        if (!template) return [];
        let counter = 0;
        const groups = template.groups.map((group) => ({
          ...group,
          id: `preview-${reference.id}-${group.id}`,
          groupType: 'CIRCUIT' as const,
          note: group.note ?? undefined,
        }));
        const blocks = mapWarmupTemplateItemsToBlocks(
          template.items,
          (type, displayName) => ({ id: '', type, displayName }),
          () => `preview-warmup-${reference.id}-${counter++}`,
        ).map((block, sortOrder) => ({
          ...block,
          groupId: block.groupId ? `preview-${reference.id}-${block.groupId}` : undefined,
          sortOrder,
        }));
        const preview = buildRoutinePreview(
          {
            name: template.name,
            days: [{ id: reference.id, title: template.name, blocks, groups }],
          },
          library,
        );
        const exercises: ClientRoutineExercise[] = preview.planDays[0]?.exercises ?? [];
        if (exercises.length === 0) return [];
        return [{ id: reference.id, name: template.name, description: null, exercises }];
      });
      return { ...day, warmups: dayWarmups };
    }),
  };
}
