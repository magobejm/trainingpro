import { setVariablesForType, type SetVariableKey } from '@trainerpro/shared';

export type PlannedSetLike = {
  durationSeconds?: null | number;
  fcMaxPct?: null | number;
  fcReservePct?: null | number;
  heartRate?: null | number;
  reps?: null | number;
  restSeconds?: null | number;
  rir?: null | number;
  rom?: null | string;
  rpe?: null | number;
  setIndex: number;
  weightKg?: null | number;
};

export type LoggedSetLike = {
  durationSecondsDone?: null | number;
  effortRir?: null | number;
  effortRpe?: null | number;
  heartRateDone?: null | number;
  hrMaxPctDone?: null | number;
  hrReservePctDone?: null | number;
  intervalIndex?: number;
  repsDone?: null | number;
  restSecondsDone?: null | number;
  romDone?: null | string;
  setIndex?: number;
  weightDoneKg?: null | number;
  avgHeartRate?: null | number;
};

export type SessionCompareItem = {
  displayName: string;
  id: string;
  intervalLogs?: LoggedSetLike[];
  logs?: LoggedSetLike[];
  plannedSets: PlannedSetLike[];
  setLogs?: LoggedSetLike[];
  type: 'cardio' | 'isometric' | 'mobility' | 'plio' | 'sport' | 'strength';
};

export type ComparedCell = {
  differs: boolean;
  done: string;
  key: SetVariableKey;
  planned: string;
};

export type ComparedRow = {
  cells: ComparedCell[];
  setIndex: number;
};

const PLANNED_KEY: Record<SetVariableKey, keyof PlannedSetLike> = {
  durationSeconds: 'durationSeconds',
  fcMaxPct: 'fcMaxPct',
  fcReservePct: 'fcReservePct',
  heartRate: 'heartRate',
  reps: 'reps',
  restSeconds: 'restSeconds',
  rir: 'rir',
  rom: 'rom',
  rpe: 'rpe',
  weightKg: 'weightKg',
};

const DONE_KEY: Record<SetVariableKey, keyof LoggedSetLike> = {
  durationSeconds: 'durationSecondsDone',
  fcMaxPct: 'hrMaxPctDone',
  fcReservePct: 'hrReservePctDone',
  heartRate: 'heartRateDone',
  reps: 'repsDone',
  restSeconds: 'restSecondsDone',
  rir: 'effortRir',
  rom: 'romDone',
  rpe: 'effortRpe',
  weightKg: 'weightDoneKg',
};

export function comparePlannedAndLogged(item: SessionCompareItem): ComparedRow[] {
  const columns = setVariablesForType(item.type);
  const logs = readLogs(item);
  const setIndexes = collectSetIndexes(item.plannedSets, logs);
  return setIndexes.map((setIndex) => {
    const planned = item.plannedSets.find((entry) => entry.setIndex === setIndex);
    const done = logs.find((entry) => (entry.setIndex ?? entry.intervalIndex) === setIndex);
    return {
      setIndex,
      cells: columns.map((key) => {
        const plannedValue = formatValue(planned?.[PLANNED_KEY[key]]);
        const doneValue = formatDone(key, done);
        return {
          differs: plannedValue !== '-' && doneValue !== '-' && plannedValue !== doneValue,
          done: doneValue,
          key,
          planned: plannedValue,
        };
      }),
    };
  });
}

function readLogs(item: SessionCompareItem): LoggedSetLike[] {
  if (item.type === 'cardio') return item.intervalLogs ?? [];
  if (item.type === 'sport') return item.setLogs ?? [];
  return item.logs ?? [];
}

function collectSetIndexes(planned: PlannedSetLike[], logs: LoggedSetLike[]): number[] {
  const indexes = new Set<number>();
  for (const set of planned) indexes.add(set.setIndex);
  for (const log of logs) {
    const index = log.setIndex ?? log.intervalIndex;
    if (index != null) indexes.add(index);
  }
  return [...indexes].sort((a, b) => a - b);
}

function formatDone(key: SetVariableKey, log: LoggedSetLike | undefined): string {
  if (!log) return '-';
  if (key === 'heartRate' && log.heartRateDone == null && log.avgHeartRate != null) {
    return formatValue(log.avgHeartRate);
  }
  return formatValue(log[DONE_KEY[key]]);
}

function formatValue(value: null | number | string | undefined): string {
  if (value == null || value === '') return '-';
  return String(value);
}
