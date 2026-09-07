import type { ClientRoutineExercise, ClientRoutineSet } from '../../data/hooks/useClientRoutineQuery';
import { filterRoutineSetColumns } from '../../utils/locked-fields.utils';

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
  return `${value}s`;
}

function formatText(value: null | string | undefined): string {
  if (!value?.trim()) return '-';
  return value.trim();
}

export function routineSetColumnsForType(type: ClientRoutineExercise['type'], lockedFields?: string[]): RoutineSetColumn[] {
  return filterRoutineSetColumns(getRoutineSetColumnsForType(type), lockedFields);
}

function getRoutineSetColumnsForType(type: ClientRoutineExercise['type']): RoutineSetColumn[] {
  switch (type) {
    case 'cardio':
      return [
        {
          key: 'fcMaxPct',
          labelKey: 'mobile.client.exercise.seriesTable.fcMaxPct',
          format: (set) => formatNumber(set.fcMaxPct),
        },
        {
          key: 'fcReservePct',
          labelKey: 'mobile.client.exercise.seriesTable.fcReservePct',
          format: (set) => formatNumber(set.fcReservePct),
        },
        {
          key: 'heartRate',
          labelKey: 'mobile.client.exercise.seriesTable.heartRate',
          format: (set) => formatNumber(set.heartRate),
        },
        { key: 'rpe', labelKey: 'client.label.rpe', format: (set) => formatNumber(set.rpe) },
      ];
    case 'isometric':
      return [
        { key: 'rpe', labelKey: 'client.label.rpe', format: (set) => formatNumber(set.rpe) },
        {
          key: 'durationSeconds',
          labelKey: 'mobile.client.exercise.seriesTable.duration',
          format: (set) => formatRest(set.durationSeconds),
        },
        {
          key: 'weightKg',
          labelKey: 'mobile.client.exercise.seriesTable.weight',
          format: (set) => formatWeight(set.weightKg),
        },
        { key: 'restSeconds', labelKey: 'client.today.restTimer', format: (set) => formatRest(set.restSeconds) },
      ];
    case 'mobility':
      return [
        { key: 'reps', labelKey: 'client.label.reps', format: (set) => formatNumber(set.reps) },
        { key: 'rpe', labelKey: 'client.label.rpe', format: (set) => formatNumber(set.rpe) },
        { key: 'rom', labelKey: 'mobile.client.exercise.seriesTable.rom', format: (set) => formatText(set.rom) },
        { key: 'restSeconds', labelKey: 'client.today.restTimer', format: (set) => formatRest(set.restSeconds) },
      ];
    case 'plio':
      return [
        { key: 'reps', labelKey: 'client.label.reps', format: (set) => formatNumber(set.reps) },
        { key: 'rpe', labelKey: 'client.label.rpe', format: (set) => formatNumber(set.rpe) },
        {
          key: 'weightKg',
          labelKey: 'mobile.client.exercise.seriesTable.weight',
          format: (set) => formatWeight(set.weightKg),
        },
        { key: 'restSeconds', labelKey: 'client.today.restTimer', format: (set) => formatRest(set.restSeconds) },
      ];
    case 'sport':
      return [
        { key: 'reps', labelKey: 'client.label.reps', format: (set) => formatNumber(set.reps) },
        { key: 'rpe', labelKey: 'client.label.rpe', format: (set) => formatNumber(set.rpe) },
        { key: 'rir', labelKey: 'client.label.rir', format: (set) => formatNumber(set.rir) },
        {
          key: 'weightKg',
          labelKey: 'mobile.client.exercise.seriesTable.weight',
          format: (set) => formatWeight(set.weightKg),
        },
        { key: 'restSeconds', labelKey: 'client.today.restTimer', format: (set) => formatRest(set.restSeconds) },
      ];
    default:
      return [
        { key: 'reps', labelKey: 'client.label.reps', format: (set) => formatNumber(set.reps) },
        {
          key: 'weightKg',
          labelKey: 'mobile.client.exercise.seriesTable.weight',
          format: (set) => formatWeight(set.weightKg),
        },
        { key: 'rir', labelKey: 'client.label.rir', format: (set) => formatNumber(set.rir) },
        { key: 'rpe', labelKey: 'client.label.rpe', format: (set) => formatNumber(set.rpe) },
        { key: 'restSeconds', labelKey: 'client.today.restTimer', format: (set) => formatRest(set.restSeconds) },
      ];
  }
}

export function formatExerciseRepRange(exercise: ClientRoutineExercise): null | string {
  if (exercise.repsMin && exercise.repsMax) return `${exercise.repsMin}-${exercise.repsMax}`;
  if (exercise.repsMin != null) return String(exercise.repsMin);
  if (exercise.repsMax != null) return String(exercise.repsMax);
  return null;
}

export function isAdvancedRoutineSet(set: ClientRoutineSet): boolean {
  return Boolean(set.advancedTechnique?.trim());
}
