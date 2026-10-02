export type ExerciseBlockType = 'cardio' | 'isometric' | 'mobility' | 'plio' | 'sport' | 'strength';

export type SetVariableKey =
  | 'durationSeconds'
  | 'fcMaxPct'
  | 'fcReservePct'
  | 'heartRate'
  | 'reps'
  | 'restSeconds'
  | 'rir'
  | 'rom'
  | 'rpe'
  | 'weightKg';

export const MAX_ACTIVE_SET_VARIABLES = 6;

export const SET_VARIABLE_PRIORITY: SetVariableKey[] = [
  'reps',
  'weightKg',
  'rpe',
  'fcMaxPct',
  'durationSeconds',
  'heartRate',
  'rir',
  'fcReservePct',
  'rom',
  'restSeconds',
];

const SET_VARIABLES_BY_TYPE: Record<ExerciseBlockType, SetVariableKey[]> = {
  strength: ['reps', 'weightKg', 'rpe', 'rir', 'restSeconds'],
  cardio: ['rpe', 'fcMaxPct', 'durationSeconds', 'heartRate', 'fcReservePct', 'restSeconds'],
  isometric: ['weightKg', 'rpe', 'durationSeconds', 'restSeconds'],
  plio: ['reps', 'weightKg', 'rpe', 'durationSeconds', 'restSeconds'],
  mobility: ['reps', 'weightKg', 'rpe', 'rom', 'restSeconds'],
  sport: [...SET_VARIABLE_PRIORITY],
};

export const SPORT_DEFAULT_LOCKED_VARIABLES: SetVariableKey[] = ['heartRate', 'rir', 'fcReservePct', 'rom'];

export function setVariablesForType(type: ExerciseBlockType): SetVariableKey[] {
  return SET_VARIABLES_BY_TYPE[type];
}

export function resolveLockedFields(type: ExerciseBlockType, lockedFields?: string[]): string[] {
  if (lockedFields && lockedFields.length > 0) return lockedFields;
  if (type === 'sport') return [...SPORT_DEFAULT_LOCKED_VARIABLES];
  return [];
}

export function canUnlockSetVariable(
  type: ExerciseBlockType,
  lockedFields: string[] | undefined,
  fieldKey: string,
): boolean {
  const columns = setVariablesForType(type);
  const locked = new Set(resolveLockedFields(type, lockedFields));
  if (!locked.has(fieldKey)) return true;
  const unlockedCount = columns.filter((key) => !locked.has(key)).length;
  return unlockedCount < MAX_ACTIVE_SET_VARIABLES;
}
