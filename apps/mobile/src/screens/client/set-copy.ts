import type { ExerciseHistoryEntry, ExerciseHistorySet, PlannedSet } from '@trainerpro/shared';
import { toSetDisplayValue } from '@trainerpro/shared';
import type { SessionItem } from '../../data/hooks/useTodaySession';
import { getSetColumns, type SetFieldKey, type SetRowState } from './active-exercise.helpers';
import { resolvePlannedSet } from './planned-set.utils';

export function targetDraft(item: SessionItem, setIndex: number): Partial<SetRowState> {
  const planned = resolvePlannedSet(item.plannedSets, setIndex);
  const draft: Partial<SetRowState> = {};
  for (const column of getSetColumns(item)) {
    const value = plannedField(item, planned, column.key);
    if (value) draft[column.key] = value;
  }
  return draft;
}

export function historyDraft(item: SessionItem, set: ExerciseHistorySet): Partial<SetRowState> {
  const keys = new Set(getSetColumns(item).map((column) => column.key));
  const draft: Partial<SetRowState> = {};
  copyNumber(keys, draft, 'reps', set.repsDone);
  copyNumber(keys, draft, 'weight', set.weightDoneKg);
  copyNumber(keys, draft, 'rpe', set.effortRpe);
  copyNumber(keys, draft, 'rir', set.effortRir);
  copyNumber(keys, draft, 'heartRate', set.heartRateDone);
  copyNumber(keys, draft, 'fcMaxPct', set.hrMaxPctDone);
  copyNumber(keys, draft, 'fcReservePct', set.hrReservePctDone);
  if (keys.has('rom') && set.romDone?.trim()) draft.rom = set.romDone;
  if (keys.has('distance') && set.distanceDoneMeters != null) draft.distance = numberText(set.distanceDoneMeters / 1000);
  if (keys.has('duration') && set.durationSecondsDone != null) {
    draft.duration = numberText(toSetDisplayValue(item.type, 'durationSeconds', set.durationSecondsDone));
  }
  return draft;
}

export function sourceOccurrence(group: SessionItem[], item: SessionItem): number {
  const source = item.sourceExerciseId ?? item.id;
  const index = group
    .filter((entry) => (entry.sourceExerciseId ?? entry.id) === source)
    .findIndex((entry) => entry.id === item.id);
  return Math.max(0, index);
}

export function matchHistorySet(
  entries: ExerciseHistoryEntry[],
  setIndex: number,
  occurrence: number,
): ExerciseHistorySet | null {
  const entry = [...entries].sort((left, right) => right.sessionDate.localeCompare(left.sessionDate))[0];
  if (!entry) return null;
  const itemIds = [...new Set(entry.sets.map((set) => set.itemId))];
  const itemId = itemIds[occurrence] ?? itemIds[0];
  if (!itemId) return null;
  return entry.sets.find((set) => set.itemId === itemId && set.setIndex === setIndex) ?? null;
}

export function draftHasCopy(values: Partial<SetRowState>): boolean {
  return Object.values(values).some((value) => value.trim().length > 0);
}

function plannedField(item: SessionItem, planned: PlannedSet | null, key: SetFieldKey): string {
  if (key === 'reps') return numberText(planned?.reps ?? strengthReps(item));
  if (key === 'weight') return numberText(planned?.weightKg ?? strengthWeight(item));
  if (key === 'rpe') return numberText(planned?.rpe ?? item.targetRpe);
  if (key === 'rir') return numberText(planned?.rir ?? (item.type === 'strength' ? item.targetRir : null));
  if (key === 'rom') return planned?.rom?.trim() ?? '';
  if (key === 'heartRate') return numberText(planned?.heartRate);
  if (key === 'fcMaxPct') return numberText(planned?.fcMaxPct);
  if (key === 'fcReservePct') return numberText(planned?.fcReservePct);
  if (key === 'distance') return numberText(distanceKm(item, planned));
  if (key === 'duration') return durationText(item, planned);
  return '';
}

function strengthReps(item: SessionItem): number | null {
  return item.type === 'strength' ? (item.repsMax ?? item.repsMin) : null;
}

function strengthWeight(item: SessionItem): number | null {
  return item.type === 'strength' ? (item.weightRangeMaxKg ?? item.weightRangeMinKg) : null;
}

function distanceKm(item: SessionItem, planned: PlannedSet | null): number | null {
  const metres = planned?.distanceMeters ?? (item.type === 'cardio' ? item.targetDistanceMeters : null);
  return metres == null ? null : metres / 1000;
}

function durationText(item: SessionItem, planned: PlannedSet | null): string {
  const seconds = planned?.durationSeconds ?? fallbackDuration(item);
  return seconds == null ? '' : numberText(toSetDisplayValue(item.type, 'durationSeconds', seconds));
}

function fallbackDuration(item: SessionItem): number | null {
  if (item.type === 'cardio') return item.workSeconds || null;
  if (item.type === 'sport') return item.durationMinutes * 60;
  return null;
}

function copyNumber(
  keys: Set<SetFieldKey>,
  draft: Partial<SetRowState>,
  key: SetFieldKey,
  value: number | null | undefined,
): void {
  if (keys.has(key) && value != null) draft[key] = numberText(value);
}

function numberText(value: number | null | undefined): string {
  return value == null || Number.isNaN(value) ? '' : String(value);
}
