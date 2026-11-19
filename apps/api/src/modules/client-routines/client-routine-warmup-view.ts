import type { WarmupTemplateItem } from '@prisma/client';
import {
  normalizeLegacyLockedFields,
  resolveLockedFields,
  type ExerciseBlockType,
  type RoutineEditorBlockSet,
  type RoutineEditorItemKind,
  type RoutineEditorWarmupItem,
} from '@trainerpro/shared';
import { resolveWarmupItemSets, warmupItemMetadata } from '../../common/plan/client-warmups.mapper';
import { readPrescription } from './client-routine-prescription';

const number = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : null);
const text = (value: unknown) => (typeof value === 'string' ? value : null);

export const kindOfWarmupItem = (blockType: string): RoutineEditorItemKind =>
  blockType === 'strength' ? 'exercise' : (blockType as RoutineEditorItemKind);

/** The set id the editor uses: warm-up sets live inside the exercise, so the position is part of the id. */
export const warmupSetId = (itemId: string, setIndex: number) => `${itemId}:${setIndex}`;

export function lockedFieldsOfWarmupItem(item: WarmupTemplateItem): string[] {
  const metadata = warmupItemMetadata(item);
  const type = item.blockType as ExerciseBlockType;
  return metadata?.setVariablesVersion === 2
    ? resolveLockedFields(type, metadata.lockedFields)
    : normalizeLegacyLockedFields(type, metadata?.lockedFields);
}

function blockSet(itemId: string, set: Record<string, unknown>, position: number): RoutineEditorBlockSet {
  const setIndex = number(set.setIndex) ?? position;
  return {
    advancedTechnique: text(set.advancedTechnique),
    distanceMeters: number(set.distanceMeters),
    durationSeconds: number(set.durationSeconds),
    fcMaxPct: number(set.fcMaxPct),
    fcMaxPctMax: number(set.fcMaxPctMax),
    fcReservePct: number(set.fcReservePct),
    fcReservePctMax: number(set.fcReservePctMax),
    heartRate: number(set.heartRate),
    heartRateMax: number(set.heartRateMax),
    id: warmupSetId(itemId, setIndex),
    note: text(set.note),
    reps: number(set.reps),
    restSeconds: number(set.restSeconds),
    rir: number(set.rir),
    rom: text(set.rom),
    rpe: number(set.rpe),
    setIndex,
    weightKg: number(set.weightKg),
  };
}

export function warmupItemView(item: WarmupTemplateItem): RoutineEditorWarmupItem {
  const kind = kindOfWarmupItem(item.blockType);
  const prescribed = readPrescription(kind, item);
  return {
    displayName: item.displayName,
    durationMinutes: prescribed.durationMinutes,
    groupId: item.groupId,
    id: item.id,
    kind,
    lockedFields: lockedFieldsOfWarmupItem(item),
    notes: prescribed.notes,
    repsRange: prescribed.repsRange,
    sets: resolveWarmupItemSets(item).sets.map((set, position) =>
      blockSet(item.id, set as unknown as Record<string, unknown>, position),
    ),
    sortOrder: item.sortOrder,
  };
}
