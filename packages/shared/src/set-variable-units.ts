import { setVariablesForType, MAX_ACTIVE_SET_VARIABLES, type ExerciseBlockType } from './exercise-set-variables';

export function usesMinuteDuration(type: ExerciseBlockType): boolean {
  return type === 'cardio' || type === 'sport';
}

export function toSetDisplayValue(type: ExerciseBlockType, key: string, value: number): number {
  if (key === 'distanceMeters') return value / 1000;
  if (key === 'durationSeconds' && usesMinuteDuration(type)) return Math.round((value / 60) * 1000) / 1000;
  return value;
}

export function fromSetDisplayValue(type: ExerciseBlockType, key: string, value: number): number {
  if (key === 'distanceMeters') return Math.round(value * 1000);
  if (key === 'durationSeconds' && usesMinuteDuration(type)) return Math.round(value * 60);
  return value;
}

/** Expand the OLD defaults before adding a variable to an existing prescription. */
export function normalizeLegacyLockedFields(type: ExerciseBlockType, fields?: string[]): string[] {
  const locked = fields?.length ? [...fields] : type === 'sport' ? ['heartRate', 'rir', 'fcReservePct', 'rom'] : [];
  if (usesMinuteDuration(type)) {
    const active = setVariablesForType(type).filter((key) => !locked.includes(key));
    if (active.length > MAX_ACTIVE_SET_VARIABLES && !locked.includes('distanceMeters')) locked.push('distanceMeters');
  }
  return locked;
}

/** Old immutable revisions are normalized on read; new ones explicitly identify their defaults. */
export function normalizeRoutineSetVariables<T>(content: T): T {
  if (!content || typeof content !== 'object' || (content as Record<string, unknown>).setVariablesVersion === 2)
    return content;
  const visit = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(visit);
    if (!value || typeof value !== 'object') return value;
    const row = value as Record<string, unknown>;
    const next: Record<string, unknown> = Object.fromEntries(Object.entries(row).map(([key, val]) => [key, visit(val)]));
    const type = row.type ?? row.blockType;
    if (type === 'cardio' || type === 'sport')
      next.lockedFields = normalizeLegacyLockedFields(type, row.lockedFields as string[] | undefined);
    for (const [key, kind] of [
      ['cardioBlocks', 'cardio'],
      ['sportBlocks', 'sport'],
    ] as const) {
      if (Array.isArray(row[key]))
        next[key] = (next[key] as Record<string, unknown>[]).map((block, index) => ({
          ...block,
          lockedFields: normalizeLegacyLockedFields(
            kind,
            (row[key] as Record<string, unknown>[])[index]?.lockedFields as string[] | undefined,
          ),
        }));
    }
    return next;
  };
  return { ...(visit(content) as object), setVariablesVersion: 2 } as T;
}
