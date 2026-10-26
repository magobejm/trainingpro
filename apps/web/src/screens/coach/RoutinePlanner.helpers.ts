import { resolveLockedFields } from '@trainerpro/shared';
import { normalizePlanTemplateId } from '../../data/normalize-plan-template-id';
import type { BlockType, DraftBlock, DraftDay, DraftSet, DraftState } from './RoutinePlanner.types';
import { mapTemplateToDraft as mapTemplateToDraftImpl } from './RoutinePlanner.draft-mapper';
import { mapWarmupTemplateItemsToBlocks as mapWarmupTemplateItemsToBlocksImpl } from './RoutinePlanner.template-mapper';

let blockIdCounter = Date.now();
let dayIdCounter = Date.now();
let groupIdCounter = Date.now();

export const nextBlockId = () => `b-${++blockIdCounter}`;
export const nextDayId = () => `d-${++dayIdCounter}`;
export const nextGroupId = () => `g-${++groupIdCounter}`;

export function createEmptyDay(index: number, t: (k: string) => string, prefixKey = 'coach.routine.dayPrefix'): DraftDay {
  return {
    blocks: [],
    groups: [],
    id: nextDayId(),
    title: `${t(prefixKey)} ${index}`,
  };
}

export function createEmptyDraft(t: (k: string) => string, prefixKey = 'coach.routine.dayPrefix'): DraftState {
  return {
    days: [createEmptyDay(1, t, prefixKey)],
    expectedCompletionDays: null,
    mesocycleMicrocycles: null,
    name: '',
    neats: [],
    objectiveIds: [],
  };
}

export function createBlock(type: BlockType, displayName: string): DraftBlock {
  const base: DraftBlock = { displayName, id: nextBlockId(), sets: [], type, lockedFields: resolveLockedFields(type) };
  if (['cardio', 'plio', 'mobility'].includes(type)) {
    base.restSeconds = 30;
    base.roundsPlanned = 3;
    base.workSeconds = 30;
  }
  if (type === 'strength') {
    base.setsPlanned = 3;
    base.repsPlanned = 10;
    base.restSeconds = 60;
  }
  if (type === 'isometric') {
    base.setsPlanned = 3;
  }
  if (type === 'sport') {
    base.durationMinutes = 30;
    base.lockedFields = resolveLockedFields(type);
  }
  return base;
}

/** Copy the previous set (index - 1) into a new set at the given index */
export function copyPreviousSet(sets: DraftSet[], index: number): DraftSet {
  if (index === 0 || sets.length === 0) {
    return { setIndex: index };
  }
  const prev = sets[index - 1] ?? sets[sets.length - 1];
  if (!prev) return { setIndex: index };
  return {
    ...prev,
    setIndex: index,
  };
}

export { buildRoutinePayload } from './RoutinePlanner.payload';

export function mapWarmupTemplateItemsToBlocks(
  items: Array<{
    blockType: string;
    [key: string]: unknown;
  }>,
): DraftBlock[] {
  return mapWarmupTemplateItemsToBlocksImpl(items, createBlock, nextBlockId);
}

export function mapTemplateToDraft(tpl: unknown): DraftState {
  const mapped = mapTemplateToDraftImpl(tpl as Parameters<typeof mapTemplateToDraftImpl>[0], createBlock, nextDayId);
  const rawId = (tpl as { id?: unknown }).id;
  if (typeof rawId === 'string' && rawId.length > 0) {
    const canon = normalizePlanTemplateId(rawId);
    if (canon) {
      return { ...mapped, sourcePlanTemplateId: canon };
    }
  }
  return mapped;
}
