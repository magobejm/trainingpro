import { formatClock, type ExerciseBlockType, type ExerciseHistorySet } from '@trainerpro/shared';

type Column = { key: Exclude<keyof ExerciseHistorySet, 'itemId' | 'setIndex'>; label: string; unit?: string };
const columns: Column[] = [
  { key: 'repsDone', label: 'reps' },
  { key: 'weightDoneKg', label: 'weight', unit: 'kg' },
  { key: 'effortRpe', label: 'rpe' },
  { key: 'hrMaxPctDone', label: 'fcMaxPct', unit: '%' },
  { key: 'durationSecondsDone', label: 'duration' },
  { key: 'distanceDoneMeters', label: 'distance', unit: 'km' },
  { key: 'heartRateDone', label: 'heartRate', unit: 'bpm' },
  { key: 'effortRir', label: 'rir' },
  { key: 'hrReservePctDone', label: 'fcReservePct', unit: '%' },
  { key: 'romDone', label: 'rom' },
  { key: 'restSecondsDone', label: 'rest' },
];

export function historyColumns(sets: ExerciseHistorySet[], _type?: ExerciseBlockType): Column[] {
  void _type;
  return columns.filter(({ key }) => sets.some((set) => set[key] != null && set[key] !== ''));
}

export function historyCell(
  value: number | string | null | undefined,
  key?: Column['key'],
  _type?: ExerciseBlockType,
): string {
  void _type;
  if (typeof value === 'number' && key === 'distanceDoneMeters') return String(value / 1000);
  if (typeof value === 'number' && (key === 'durationSecondsDone' || key === 'restSecondsDone')) return formatClock(value);
  return value == null || value === '' ? '—' : String(value);
}

export function historyDate(value: string, language: string): string {
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString(language, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
