import { colors } from '@trainerpro/ui';
import type { VariableDef } from './progress-screen.types';
import type { SessionProgressCategory } from '../../../data/types/session-progress';

/** Fuerza / Grupo muscular */
export const STRENGTH_VARIABLES: VariableDef[] = [
  { id: 'sets', labelKey: 'coach.progress.variable.sets', unit: '', color: colors.success, dataKey: 'sets' },
  { id: 'totalReps', labelKey: 'coach.progress.variable.volumeLoad', unit: '', color: colors.info, dataKey: 'totalReps' },
  { id: 'tonnage', labelKey: 'coach.progress.variable.tonnage', unit: 'kg', color: colors.chartPurple, dataKey: 'tonnage' },
  { id: 'avgRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: colors.danger, dataKey: 'avgRpe' },
  { id: 'inol', labelKey: 'coach.progress.variable.inol', unit: '', color: colors.warning, dataKey: 'inol' },
];

export const CARDIO_VARIABLES: VariableDef[] = [
  { id: 'sets', labelKey: 'coach.progress.variable.sets', unit: '', color: colors.success, dataKey: 'sets' },
  { id: 'avgRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: colors.danger, dataKey: 'avgRpe' },
  {
    id: 'avgHeartRate',
    labelKey: 'coach.progress.variable.avgHeartRate',
    unit: 'bpm',
    color: colors.chartPink,
    dataKey: 'avgHeartRate',
  },
  {
    id: 'totalDurationSeconds',
    labelKey: 'coach.progress.variable.totalDurationSeconds',
    unit: 's',
    color: colors.primary,
    dataKey: 'totalDurationSeconds',
  },
  {
    id: 'avgPaceMinKm',
    labelKey: 'coach.progress.variable.avgPaceMinKm',
    unit: 'min/km',
    color: colors.chartTeal,
    dataKey: 'avgPaceMinKm',
  },
  {
    id: 'fcReservePercent',
    labelKey: 'coach.progress.variable.fcReservePercent',
    unit: '%',
    color: colors.warning,
    dataKey: 'fcReservePercent',
  },
];

export const PLIO_VARIABLES: VariableDef[] = [
  { id: 'sets', labelKey: 'coach.progress.variable.sets', unit: '', color: colors.success, dataKey: 'sets' },
  { id: 'totalReps', labelKey: 'coach.progress.variable.volumeLoad', unit: '', color: colors.info, dataKey: 'totalReps' },
  { id: 'tonnage', labelKey: 'coach.progress.variable.tonnage', unit: 'kg', color: colors.chartPurple, dataKey: 'tonnage' },
  { id: 'avgRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: colors.danger, dataKey: 'avgRpe' },
  {
    id: 'plioEffort',
    labelKey: 'coach.progress.variable.plioEffort',
    unit: '',
    color: colors.warning,
    dataKey: 'plioEffort',
  },
];

export const ISOMETRIC_VARIABLES: VariableDef[] = [
  { id: 'sets', labelKey: 'coach.progress.variable.sets', unit: '', color: colors.success, dataKey: 'sets' },
  {
    id: 'totalDurationSeconds',
    labelKey: 'coach.progress.variable.volumeLoad',
    unit: 's',
    color: colors.info,
    dataKey: 'totalDurationSeconds',
  },
  { id: 'tonnage', labelKey: 'coach.progress.variable.tonnage', unit: 'kg', color: colors.chartPurple, dataKey: 'tonnage' },
  { id: 'avgRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: colors.danger, dataKey: 'avgRpe' },
  {
    id: 'plioEffort',
    labelKey: 'coach.progress.variable.plioEffort',
    unit: '',
    color: colors.warning,
    dataKey: 'plioEffort',
  },
];

export const MOBILITY_VARIABLES: VariableDef[] = [
  { id: 'sets', labelKey: 'coach.progress.variable.sets', unit: '', color: colors.success, dataKey: 'sets' },
  { id: 'totalReps', labelKey: 'coach.progress.variable.volumeLoad', unit: '', color: colors.info, dataKey: 'totalReps' },
  { id: 'avgRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: colors.danger, dataKey: 'avgRpe' },
];

export const SPORT_VARIABLES: VariableDef[] = [
  { id: 'sets', labelKey: 'coach.progress.variable.sets', unit: '', color: colors.success, dataKey: 'sets' },
  { id: 'totalReps', labelKey: 'coach.progress.variable.volumeLoad', unit: '', color: colors.info, dataKey: 'totalReps' },
  { id: 'tonnage', labelKey: 'coach.progress.variable.tonnage', unit: 'kg', color: colors.chartPurple, dataKey: 'tonnage' },
  { id: 'avgRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: colors.danger, dataKey: 'avgRpe' },
  {
    id: 'avgHeartRate',
    labelKey: 'coach.progress.variable.avgHeartRate',
    unit: 'bpm',
    color: colors.chartPink,
    dataKey: 'avgHeartRate',
  },
  {
    id: 'avgPaceMinKm',
    labelKey: 'coach.progress.variable.avgPaceMinKm',
    unit: 'min/km',
    color: colors.chartTeal,
    dataKey: 'avgPaceMinKm',
  },
  {
    id: 'fcReservePercent',
    labelKey: 'coach.progress.variable.fcReservePercent',
    unit: '%',
    color: colors.warning,
    dataKey: 'fcReservePercent',
  },
];

/** Session progress by category (aligned with GET /progress/session + category). */
export const SESSION_STRENGTH_VARS: VariableDef[] = [
  {
    id: 'sessionTonnage',
    labelKey: 'coach.progress.variable.tonnage',
    unit: 'kg',
    color: colors.chartPurple,
    dataKey: 'sessionTonnage',
  },
  { id: 'sessionInol', labelKey: 'coach.progress.variable.inol', unit: '', color: colors.warning, dataKey: 'sessionInol' },
  { id: 'sessionRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: colors.danger, dataKey: 'sessionRpe' },
  {
    id: 'effortIndex',
    labelKey: 'coach.progress.variable.effortIndex',
    unit: '',
    color: colors.primary,
    dataKey: 'effortIndex',
  },
];

export const SESSION_CARDIO_VARS: VariableDef[] = [
  { id: 'sessionRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: colors.danger, dataKey: 'sessionRpe' },
  {
    id: 'trainingLoad',
    labelKey: 'coach.progress.variable.trainingLoad',
    unit: '',
    color: colors.warning,
    dataKey: 'trainingLoad',
  },
  {
    id: 'sessionEfficiency',
    labelKey: 'coach.progress.variable.efficiency',
    unit: '',
    color: colors.success,
    dataKey: 'sessionEfficiency',
  },
];

export const SESSION_PLIO_VARS: VariableDef[] = [
  {
    id: 'sessionTonnage',
    labelKey: 'coach.progress.variable.tonnage',
    unit: 'kg',
    color: colors.chartPurple,
    dataKey: 'sessionTonnage',
  },
  { id: 'sessionRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: colors.danger, dataKey: 'sessionRpe' },
];

export const SESSION_ISO_VARS: VariableDef[] = [...SESSION_PLIO_VARS];

export const SESSION_MOBILITY_VARS: VariableDef[] = [
  { id: 'sessionRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: colors.danger, dataKey: 'sessionRpe' },
];

export const SESSION_SPORT_VARS: VariableDef[] = [
  {
    id: 'sessionTonnage',
    labelKey: 'coach.progress.variable.tonnage',
    unit: '',
    color: colors.chartPurple,
    dataKey: 'sessionTonnage',
  },
  { id: 'sessionInol', labelKey: 'coach.progress.variable.inol', unit: '', color: colors.warning, dataKey: 'sessionInol' },
  { id: 'sessionRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: colors.danger, dataKey: 'sessionRpe' },
  {
    id: 'effortIndex',
    labelKey: 'coach.progress.variable.effortIndex',
    unit: '',
    color: colors.primary,
    dataKey: 'effortIndex',
  },
  {
    id: 'sessionEfficiency',
    labelKey: 'coach.progress.variable.efficiency',
    unit: '',
    color: colors.success,
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
    color: colors.warning,
    dataKey: 'trainingLoad',
  },
  {
    id: 'sessionEfficiency',
    labelKey: 'coach.progress.variable.efficiency',
    unit: '',
    color: colors.success,
    dataKey: 'sessionEfficiency',
  },
];

export const MICROCYCLE_VARIABLES: VariableDef[] = [
  {
    id: 'totalTonnage',
    labelKey: 'coach.progress.variable.tonnage',
    unit: 'kg',
    color: colors.chartPurple,
    dataKey: 'totalTonnage',
  },
  { id: 'avgRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: colors.danger, dataKey: 'avgRpe' },
  {
    id: 'totalTrainingLoad',
    labelKey: 'coach.progress.variable.trainingLoad',
    unit: '',
    color: colors.warning,
    dataKey: 'totalTrainingLoad',
  },
  {
    id: 'sessionsCount',
    labelKey: 'coach.progress.variable.sessionsCount',
    unit: '',
    color: colors.success,
    dataKey: 'sessionsCount',
  },
];

/** Microcycle aggregates by category (aligned with GET /progress/microcycle + category). */
export const MICRO_STRENGTH_VARS: VariableDef[] = [
  {
    id: 'totalTonnage',
    labelKey: 'coach.progress.variable.tonnage',
    unit: 'kg',
    color: colors.chartPurple,
    dataKey: 'totalTonnage',
  },
  { id: 'avgRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: colors.danger, dataKey: 'avgRpe' },
];

export const MICRO_CARDIO_VARS: VariableDef[] = [
  { id: 'avgRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: colors.danger, dataKey: 'avgRpe' },
  {
    id: 'totalTrainingLoad',
    labelKey: 'coach.progress.variable.trainingLoad',
    unit: '',
    color: colors.warning,
    dataKey: 'totalTrainingLoad',
  },
];

export const MICRO_PLIO_VARS: VariableDef[] = [...MICRO_STRENGTH_VARS];
export const MICRO_ISO_VARS: VariableDef[] = [...MICRO_STRENGTH_VARS];

export const MICRO_MOBILITY_VARS: VariableDef[] = [
  { id: 'avgRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: colors.danger, dataKey: 'avgRpe' },
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
