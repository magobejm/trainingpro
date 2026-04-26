import type { VariableDef } from './progress-screen.types';
import type { SessionProgressCategory } from '../../../data/types/session-progress';

/** Fuerza / Grupo muscular */
export const STRENGTH_VARIABLES: VariableDef[] = [
  { id: 'sets', labelKey: 'coach.progress.variable.sets', unit: '', color: '#10b981', dataKey: 'sets' },
  { id: 'totalReps', labelKey: 'coach.progress.variable.volumeLoad', unit: '', color: '#06b6d4', dataKey: 'totalReps' },
  { id: 'tonnage', labelKey: 'coach.progress.variable.tonnage', unit: 'kg', color: '#8b5cf6', dataKey: 'tonnage' },
  { id: 'avgRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: '#ef4444', dataKey: 'avgRpe' },
  { id: 'inol', labelKey: 'coach.progress.variable.inol', unit: '', color: '#f59e0b', dataKey: 'inol' },
];

export const CARDIO_VARIABLES: VariableDef[] = [
  { id: 'sets', labelKey: 'coach.progress.variable.sets', unit: '', color: '#10b981', dataKey: 'sets' },
  { id: 'avgRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: '#ef4444', dataKey: 'avgRpe' },
  {
    id: 'avgHeartRate',
    labelKey: 'coach.progress.variable.avgHeartRate',
    unit: 'bpm',
    color: '#ec4899',
    dataKey: 'avgHeartRate',
  },
  {
    id: 'totalDurationSeconds',
    labelKey: 'coach.progress.variable.totalDurationSeconds',
    unit: 's',
    color: '#6366f1',
    dataKey: 'totalDurationSeconds',
  },
  {
    id: 'avgPaceMinKm',
    labelKey: 'coach.progress.variable.avgPaceMinKm',
    unit: 'min/km',
    color: '#14b8a6',
    dataKey: 'avgPaceMinKm',
  },
  {
    id: 'fcReservePercent',
    labelKey: 'coach.progress.variable.fcReservePercent',
    unit: '%',
    color: '#f97316',
    dataKey: 'fcReservePercent',
  },
];

export const PLIO_VARIABLES: VariableDef[] = [
  { id: 'sets', labelKey: 'coach.progress.variable.sets', unit: '', color: '#10b981', dataKey: 'sets' },
  { id: 'totalReps', labelKey: 'coach.progress.variable.volumeLoad', unit: '', color: '#06b6d4', dataKey: 'totalReps' },
  { id: 'tonnage', labelKey: 'coach.progress.variable.tonnage', unit: 'kg', color: '#8b5cf6', dataKey: 'tonnage' },
  { id: 'avgRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: '#ef4444', dataKey: 'avgRpe' },
  {
    id: 'plioEffort',
    labelKey: 'coach.progress.variable.plioEffort',
    unit: '',
    color: '#f59e0b',
    dataKey: 'plioEffort',
  },
];

export const ISOMETRIC_VARIABLES: VariableDef[] = [
  { id: 'sets', labelKey: 'coach.progress.variable.sets', unit: '', color: '#10b981', dataKey: 'sets' },
  {
    id: 'totalDurationSeconds',
    labelKey: 'coach.progress.variable.volumeLoad',
    unit: 's',
    color: '#06b6d4',
    dataKey: 'totalDurationSeconds',
  },
  { id: 'tonnage', labelKey: 'coach.progress.variable.tonnage', unit: 'kg', color: '#8b5cf6', dataKey: 'tonnage' },
  { id: 'avgRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: '#ef4444', dataKey: 'avgRpe' },
  {
    id: 'plioEffort',
    labelKey: 'coach.progress.variable.plioEffort',
    unit: '',
    color: '#f59e0b',
    dataKey: 'plioEffort',
  },
];

export const MOBILITY_VARIABLES: VariableDef[] = [
  { id: 'sets', labelKey: 'coach.progress.variable.sets', unit: '', color: '#10b981', dataKey: 'sets' },
  { id: 'totalReps', labelKey: 'coach.progress.variable.volumeLoad', unit: '', color: '#06b6d4', dataKey: 'totalReps' },
  { id: 'avgRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: '#ef4444', dataKey: 'avgRpe' },
];

export const SPORT_VARIABLES: VariableDef[] = [
  { id: 'sets', labelKey: 'coach.progress.variable.sets', unit: '', color: '#10b981', dataKey: 'sets' },
  { id: 'totalReps', labelKey: 'coach.progress.variable.volumeLoad', unit: '', color: '#06b6d4', dataKey: 'totalReps' },
  { id: 'tonnage', labelKey: 'coach.progress.variable.tonnage', unit: 'kg', color: '#8b5cf6', dataKey: 'tonnage' },
  { id: 'avgRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: '#ef4444', dataKey: 'avgRpe' },
  {
    id: 'avgHeartRate',
    labelKey: 'coach.progress.variable.avgHeartRate',
    unit: 'bpm',
    color: '#ec4899',
    dataKey: 'avgHeartRate',
  },
  {
    id: 'avgPaceMinKm',
    labelKey: 'coach.progress.variable.avgPaceMinKm',
    unit: 'min/km',
    color: '#14b8a6',
    dataKey: 'avgPaceMinKm',
  },
  {
    id: 'fcReservePercent',
    labelKey: 'coach.progress.variable.fcReservePercent',
    unit: '%',
    color: '#f97316',
    dataKey: 'fcReservePercent',
  },
];

/** Session progress by category (aligned with GET /progress/session + category). */
export const SESSION_STRENGTH_VARS: VariableDef[] = [
  {
    id: 'sessionTonnage',
    labelKey: 'coach.progress.variable.tonnage',
    unit: 'kg',
    color: '#8b5cf6',
    dataKey: 'sessionTonnage',
  },
  { id: 'sessionInol', labelKey: 'coach.progress.variable.inol', unit: '', color: '#f59e0b', dataKey: 'sessionInol' },
  { id: 'sessionRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: '#ef4444', dataKey: 'sessionRpe' },
  { id: 'effortIndex', labelKey: 'coach.progress.variable.effortIndex', unit: '', color: '#3b82f6', dataKey: 'effortIndex' },
];

export const SESSION_CARDIO_VARS: VariableDef[] = [
  { id: 'sessionRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: '#ef4444', dataKey: 'sessionRpe' },
  {
    id: 'trainingLoad',
    labelKey: 'coach.progress.variable.trainingLoad',
    unit: '',
    color: '#f97316',
    dataKey: 'trainingLoad',
  },
  {
    id: 'sessionEfficiency',
    labelKey: 'coach.progress.variable.efficiency',
    unit: '',
    color: '#10b981',
    dataKey: 'sessionEfficiency',
  },
];

export const SESSION_PLIO_VARS: VariableDef[] = [
  {
    id: 'sessionTonnage',
    labelKey: 'coach.progress.variable.tonnage',
    unit: 'kg',
    color: '#8b5cf6',
    dataKey: 'sessionTonnage',
  },
  { id: 'sessionRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: '#ef4444', dataKey: 'sessionRpe' },
];

export const SESSION_ISO_VARS: VariableDef[] = [...SESSION_PLIO_VARS];

export const SESSION_MOBILITY_VARS: VariableDef[] = [
  { id: 'sessionRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: '#ef4444', dataKey: 'sessionRpe' },
];

export const SESSION_SPORT_VARS: VariableDef[] = [
  {
    id: 'sessionTonnage',
    labelKey: 'coach.progress.variable.tonnage',
    unit: '',
    color: '#8b5cf6',
    dataKey: 'sessionTonnage',
  },
  { id: 'sessionInol', labelKey: 'coach.progress.variable.inol', unit: '', color: '#f59e0b', dataKey: 'sessionInol' },
  { id: 'sessionRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: '#ef4444', dataKey: 'sessionRpe' },
  { id: 'effortIndex', labelKey: 'coach.progress.variable.effortIndex', unit: '', color: '#3b82f6', dataKey: 'effortIndex' },
  {
    id: 'sessionEfficiency',
    labelKey: 'coach.progress.variable.efficiency',
    unit: '',
    color: '#10b981',
    dataKey: 'sessionEfficiency',
  },
];

export function getSessionVarsForCategory(category: SessionProgressCategory | null): VariableDef[] {
  if (!category) return [];
  if (category === 'strength') return SESSION_STRENGTH_VARS;
  if (category === 'cardio') return SESSION_CARDIO_VARS;
  if (category === 'plio') return SESSION_PLIO_VARS;
  if (category === 'isometric') return SESSION_ISO_VARS;
  if (category === 'mobility') return SESSION_MOBILITY_VARS;
  return SESSION_SPORT_VARS;
}

/** Legacy union chart vars (session + category filter uses getSessionVarsForCategory). */
export const SESSION_VARIABLES: VariableDef[] = [
  ...SESSION_STRENGTH_VARS,
  {
    id: 'trainingLoad',
    labelKey: 'coach.progress.variable.trainingLoad',
    unit: '',
    color: '#f97316',
    dataKey: 'trainingLoad',
  },
  {
    id: 'sessionEfficiency',
    labelKey: 'coach.progress.variable.efficiency',
    unit: '',
    color: '#10b981',
    dataKey: 'sessionEfficiency',
  },
];

export const MICROCYCLE_VARIABLES: VariableDef[] = [
  { id: 'totalTonnage', labelKey: 'coach.progress.variable.tonnage', unit: 'kg', color: '#8b5cf6', dataKey: 'totalTonnage' },
  { id: 'avgRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: '#ef4444', dataKey: 'avgRpe' },
  {
    id: 'totalTrainingLoad',
    labelKey: 'coach.progress.variable.trainingLoad',
    unit: '',
    color: '#f97316',
    dataKey: 'totalTrainingLoad',
  },
  {
    id: 'sessionsCount',
    labelKey: 'coach.progress.variable.sessionsCount',
    unit: '',
    color: '#10b981',
    dataKey: 'sessionsCount',
  },
];

/** Microcycle aggregates by category (aligned with GET /progress/microcycle + category). */
export const MICRO_STRENGTH_VARS: VariableDef[] = [
  { id: 'totalTonnage', labelKey: 'coach.progress.variable.tonnage', unit: 'kg', color: '#8b5cf6', dataKey: 'totalTonnage' },
  { id: 'avgRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: '#ef4444', dataKey: 'avgRpe' },
];

export const MICRO_CARDIO_VARS: VariableDef[] = [
  { id: 'avgRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: '#ef4444', dataKey: 'avgRpe' },
  {
    id: 'totalTrainingLoad',
    labelKey: 'coach.progress.variable.trainingLoad',
    unit: '',
    color: '#f97316',
    dataKey: 'totalTrainingLoad',
  },
];

export const MICRO_PLIO_VARS: VariableDef[] = [...MICRO_STRENGTH_VARS];
export const MICRO_ISO_VARS: VariableDef[] = [...MICRO_STRENGTH_VARS];

export const MICRO_MOBILITY_VARS: VariableDef[] = [
  { id: 'avgRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: '#ef4444', dataKey: 'avgRpe' },
];

export const MICRO_SPORT_VARS: VariableDef[] = [...MICRO_STRENGTH_VARS];

export function getMicrocycleVarsForCategory(category: SessionProgressCategory | null): VariableDef[] {
  if (!category) return [];
  if (category === 'strength') return MICRO_STRENGTH_VARS;
  if (category === 'cardio') return MICRO_CARDIO_VARS;
  if (category === 'plio') return MICRO_PLIO_VARS;
  if (category === 'isometric') return MICRO_ISO_VARS;
  if (category === 'mobility') return MICRO_MOBILITY_VARS;
  return MICRO_SPORT_VARS;
}
