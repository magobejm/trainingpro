import { usesMinuteDuration, toSetDisplayValue } from '../set-variable-units';
import type { ClientRoutineExercise, ClientRoutineSet } from './types';

import { resolveLockedFields, setVariablesForType, type SetVariableKey } from '../exercise-set-variables';
function formatRestLabel(seconds: number): string {
  return `${Math.max(0, Math.round(seconds))} seg`;
}
function filterRoutineSetColumns<T extends { key: string }>(columns: T[], lockedFields?: string[]): T[] {
  return columns.filter((column) => !lockedFields?.includes(column.key));
}

export type RoutineSetColumn = {
  format: (set: ClientRoutineSet) => string;
  key: string;
  labelKey: string;
};

function formatNumber(value: null | number | undefined): string {
  if (value == null) return '-';
  return String(value);
}

function formatWeight(value: null | number | undefined): string {
  if (value == null) return '-';
  return `${value}kg`;
}

function formatRest(value: null | number | undefined): string {
  if (value == null) return '-';
  return formatRestLabel(value);
}

function formatText(value: null | string | undefined): string {
  if (!value?.trim()) return '-';
  return value.trim();
}

export function routineSetColumnsForType(type: ClientRoutineExercise['type'], lockedFields?: string[]): RoutineSetColumn[] {
  return filterRoutineSetColumns(getRoutineSetColumnsForType(type), resolveLockedFields(type, lockedFields));
}

const ROUTINE_COLUMN_BY_KEY: Record<SetVariableKey, RoutineSetColumn> = {
  reps: { key: 'reps', labelKey: 'client.label.reps', format: (set) => formatNumber(set.reps) },
  weightKg: {
    key: 'weightKg',
    labelKey: 'mobile.client.exercise.seriesTable.weight',
    format: (set) => formatWeight(set.weightKg),
  },
  rpe: { key: 'rpe', labelKey: 'client.label.rpe', format: (set) => formatNumber(set.rpe) },
  fcMaxPct: {
    key: 'fcMaxPct',
    labelKey: 'mobile.client.exercise.seriesTable.fcMaxPct',
    format: (set) => formatNumber(set.fcMaxPct),
  },
  distanceMeters: {
    key: 'distanceMeters',
    labelKey: 'mobile.client.exercise.seriesTable.distance',
    format: (set) => (set.distanceMeters == null ? '-' : `${set.distanceMeters / 1000} km`),
  },
  durationSeconds: {
    key: 'durationSeconds',
    labelKey: 'mobile.client.exercise.seriesTable.duration',
    format: (set) => formatRest(set.durationSeconds),
  },
  heartRate: {
    key: 'heartRate',
    labelKey: 'mobile.client.exercise.seriesTable.heartRate',
    format: (set) => formatNumber(set.heartRate),
  },
  rir: { key: 'rir', labelKey: 'client.label.rir', format: (set) => formatNumber(set.rir) },
  fcReservePct: {
    key: 'fcReservePct',
    labelKey: 'mobile.client.exercise.seriesTable.fcReservePct',
    format: (set) => formatNumber(set.fcReservePct),
  },
  rom: { key: 'rom', labelKey: 'mobile.client.exercise.seriesTable.rom', format: (set) => formatText(set.rom) },
  restSeconds: { key: 'restSeconds', labelKey: 'client.today.restTimer', format: (set) => formatRest(set.restSeconds) },
};

function getRoutineSetColumnsForType(type: ClientRoutineExercise['type']): RoutineSetColumn[] {
  return setVariablesForType(type).map((key) =>
    key === 'durationSeconds' && usesMinuteDuration(type)
      ? {
          ...ROUTINE_COLUMN_BY_KEY[key],
          labelKey: 'mobile.client.exercise.seriesTable.durationMinutes',
          format: (set) => (set.durationSeconds == null ? '-' : `${toSetDisplayValue(type, key, set.durationSeconds)} min`),
        }
      : ROUTINE_COLUMN_BY_KEY[key],
  );
}

export function exerciseTypeShowsRepRange(type: ClientRoutineExercise['type']): boolean {
  return type === 'strength' || type === 'plio' || type === 'mobility' || type === 'sport';
}

export function formatRepRangeBounds(repsMin: null | number | undefined, repsMax: null | number | undefined): null | string {
  if (repsMin != null && repsMax != null) {
    return repsMin === repsMax ? String(repsMin) : `${repsMin}-${repsMax}`;
  }
  if (repsMin != null) return String(repsMin);
  if (repsMax != null) return String(repsMax);
  return null;
}

export function formatExerciseRepRange(exercise: ClientRoutineExercise): null | string {
  if (!exerciseTypeShowsRepRange(exercise.type)) return null;
  return formatRepRangeBounds(exercise.repsMin, exercise.repsMax);
}

export function isAdvancedRoutineSet(set: ClientRoutineSet): boolean {
  return Boolean(set.advancedTechnique?.trim());
}
