import {
  formatClock,
  formatHeartRateBand,
  toSetDisplayValue,
  setVariablesForType,
  type SetVariableKey,
} from '@trainerpro/shared';

export type PlannedSetLike = {
  distanceMeters?: null | number;
  durationSeconds?: null | number;
  fcMaxPct?: null | number;
  fcMaxPctMax?: null | number;
  fcReservePct?: null | number;
  fcReservePctMax?: null | number;
  heartRate?: null | number;
  heartRateMax?: null | number;
  reps?: null | number;
  restSeconds?: null | number;
  rir?: null | number;
  rom?: null | string;
  rpe?: null | number;
  setIndex: number;
  weightKg?: null | number;
};

export type LoggedSetLike = {
  distanceDoneMeters?: null | number;
  durationSecondsDone?: null | number;
  effortRir?: null | number;
  effortRpe?: null | number;
  avgHeartRateMax?: null | number;
  heartRateDone?: null | number;
  heartRateDoneMax?: null | number;
  hrMaxPctDone?: null | number;
  hrMaxPctDoneMax?: null | number;
  hrReservePctDone?: null | number;
  hrReservePctDoneMax?: null | number;
  intervalIndex?: number;
  repsDone?: null | number;
  restSecondsDone?: null | number;
  romDone?: null | string;
  setIndex?: number;
  weightDoneKg?: null | number;
  avgHeartRate?: null | number;
};

export type SessionCompareItem = {
  completionOrder?: null | number;
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
  distanceMeters: 'distanceMeters',
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
  distanceMeters: 'distanceDoneMeters',
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
        const plannedValue = formatPlanned(item.type, key, planned);
        const doneValue = formatDone(key, done, item.type);
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

function formatPlanned(type: SessionCompareItem['type'], key: SetVariableKey, planned: PlannedSetLike | undefined): string {
  if (!planned) return '-';
  if (key === 'heartRate') return formatHeartRateBand(planned.heartRate, planned.heartRateMax) || '-';
  if (key === 'fcMaxPct') return formatHeartRateBand(planned.fcMaxPct, planned.fcMaxPctMax) || '-';
  if (key === 'fcReservePct') return formatHeartRateBand(planned.fcReservePct, planned.fcReservePctMax) || '-';
  return formatDisplay(type, key, planned[PLANNED_KEY[key]]);
}

function formatDone(key: SetVariableKey, log: LoggedSetLike | undefined, type: SessionCompareItem['type']): string {
  if (!log) return '-';
  if (key === 'heartRate') {
    return formatHeartRateBand(log.heartRateDone ?? log.avgHeartRate, log.heartRateDoneMax ?? log.avgHeartRateMax) || '-';
  }
  if (key === 'fcMaxPct') return formatHeartRateBand(log.hrMaxPctDone, log.hrMaxPctDoneMax) || '-';
  if (key === 'fcReservePct') return formatHeartRateBand(log.hrReservePctDone, log.hrReservePctDoneMax) || '-';
  return formatDisplay(type, key, log[DONE_KEY[key]]);
}

function formatValue(value: null | number | string | undefined): string {
  if (value == null || value === '') return '-';
  return String(value);
}

function formatDisplay(type: SessionCompareItem['type'], key: SetVariableKey, value: unknown): string {
  if (typeof value === 'number' && (key === 'durationSeconds' || key === 'restSeconds')) return formatClock(value);
  return formatValue(typeof value === 'number' ? toSetDisplayValue(type, key, value) : (value as string | null | undefined));
}
