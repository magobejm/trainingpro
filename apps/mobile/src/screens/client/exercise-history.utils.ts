import type { ExerciseHistorySet } from '@trainerpro/shared';

type Column = { key: Exclude<keyof ExerciseHistorySet, 'itemId' | 'setIndex'>; label: string; unit?: string };
const columns: Column[] = [
  { key: 'repsDone', label: 'reps' },
  { key: 'weightDoneKg', label: 'weight', unit: 'kg' },
  { key: 'durationSecondsDone', label: 'duration', unit: 's' },
  { key: 'distanceDoneMeters', label: 'distance', unit: 'm' },
  { key: 'effortRpe', label: 'rpe' },
  { key: 'effortRir', label: 'rir' },
  { key: 'heartRateDone', label: 'heartRate', unit: 'bpm' },
  { key: 'hrMaxPctDone', label: 'fcMaxPct', unit: '%' },
  { key: 'hrReservePctDone', label: 'fcReservePct', unit: '%' },
  { key: 'romDone', label: 'rom' },
  { key: 'restSecondsDone', label: 'rest', unit: 's' },
];

export function historyColumns(sets: ExerciseHistorySet[]): Column[] {
  return columns.filter(({ key }) => sets.some((set) => set[key] != null && set[key] !== ''));
}

export function historyCell(value: number | string | null | undefined): string {
  return value == null || value === '' ? '—' : String(value);
}

export function historyDate(value: string, language: string): string {
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString(language, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
