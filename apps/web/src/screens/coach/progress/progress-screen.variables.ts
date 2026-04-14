import type { VariableDef } from './progress-screen.types';

export const EXERCISE_VARIABLES: VariableDef[] = [
  { id: 'e1rm', labelKey: 'coach.progress.variable.e1rm', unit: 'kg', color: '#3b82f6', dataKey: 'e1rm' },
  { id: 'tonnage', labelKey: 'coach.progress.variable.tonnage', unit: 'kg', color: '#8b5cf6', dataKey: 'tonnage' },
  { id: 'inol', labelKey: 'coach.progress.variable.inol', unit: '', color: '#f59e0b', dataKey: 'inol' },
  { id: 'avgRpe', labelKey: 'coach.progress.variable.rpe', unit: '', color: '#ef4444', dataKey: 'avgRpe' },
  { id: 'sets', labelKey: 'coach.progress.variable.sets', unit: '', color: '#10b981', dataKey: 'sets' },
  { id: 'totalReps', labelKey: 'coach.progress.variable.totalReps', unit: '', color: '#06b6d4', dataKey: 'totalReps' },
];

export const SESSION_VARIABLES: VariableDef[] = [
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
