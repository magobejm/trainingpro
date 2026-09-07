import type { SetColumn } from '../screens/client/active-exercise.helpers';

const WEB_TO_ACTIVE_FIELD: Record<string, string[]> = {
  durationSeconds: ['duration'],
  fcMaxPct: [],
  fcReservePct: [],
  heartRate: ['heartRate'],
  reps: ['reps'],
  restSeconds: ['rest', 'duration'],
  rir: ['rir'],
  rom: ['rom'],
  rpe: ['rpe'],
  weightKg: ['weight'],
};

export function isFieldLocked(lockedFields: string[] | undefined, webFieldKey: string): boolean {
  return (lockedFields ?? []).includes(webFieldKey);
}

export function isRestFieldLocked(lockedFields: string[] | undefined): boolean {
  return isFieldLocked(lockedFields, 'restSeconds');
}

export function filterRoutineSetColumns<T extends { key: string }>(columns: T[], lockedFields?: string[]): T[] {
  if (!lockedFields?.length) return columns;
  const locked = new Set(lockedFields);
  return columns.filter((column) => !locked.has(column.key));
}

export function filterActiveSetColumns(columns: SetColumn[], lockedFields?: string[]): SetColumn[] {
  if (!lockedFields?.length) return columns;
  const locked = new Set(lockedFields);
  return columns.filter((column) => {
    for (const [webKey, activeKeys] of Object.entries(WEB_TO_ACTIVE_FIELD)) {
      if (locked.has(webKey) && activeKeys.includes(column.key)) {
        return false;
      }
    }
    return true;
  });
}

export function activeFieldLocked(lockedFields: string[] | undefined, activeKey: SetColumn['key']): boolean {
  if (!lockedFields?.length) return false;
  const locked = new Set(lockedFields);
  return Object.entries(WEB_TO_ACTIVE_FIELD).some(
    ([webKey, activeKeys]) => locked.has(webKey) && activeKeys.includes(activeKey),
  );
}
