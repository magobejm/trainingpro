import type { FieldModeValue } from './entities/field-mode.entity';

export type RoutineStrengthSetInput = {
  setIndex: number;
  reps?: null | number;
  rpe?: null | number;
  weightKg?: null | number;
  rir?: null | number;
  restSeconds?: null | number;
  advancedTechnique?: null | string;
  note?: null | string;
};

export type RoutineCardioSetInput = {
  setIndex: number;
  fcMaxPct?: null | number;
  fcReservePct?: null | number;
  heartRate?: null | number;
  rpe?: null | number;
  advancedTechnique?: null | string;
  note?: null | string;
};

export type RoutinePlioSetInput = {
  setIndex: number;
  reps?: null | number;
  rpe?: null | number;
  weightKg?: null | number;
  restSeconds?: null | number;
  advancedTechnique?: null | string;
  note?: null | string;
};

export type RoutineIsometricSetInput = {
  setIndex: number;
  rpe?: null | number;
  durationSeconds?: null | number;
  weightKg?: null | number;
  restSeconds?: null | number;
  advancedTechnique?: null | string;
  note?: null | string;
};

/** Mobility per-set row (coach UI: blockType "mobility"; API field mobilityBlocks). */
export type RoutineMobilitySetInput = {
  setIndex: number;
  reps?: null | number;
  rpe?: null | number;
  rom?: null | string;
  restSeconds?: null | number;
  advancedTechnique?: null | string;
  note?: null | string;
};

export type RoutineSportSetInput = {
  setIndex: number;
  reps?: null | number;
  rpe?: null | number;
  rir?: null | number;
  weightKg?: null | number;
  fcMaxPct?: null | number;
  fcReservePct?: null | number;
  heartRate?: null | number;
  restSeconds?: null | number;
  advancedTechnique?: null | string;
  note?: null | string;
};

export type RoutineStrengthInput = {
  displayName: string;
  exerciseLibraryId?: null | string;
  fieldModes: { fieldKey: string; mode: FieldModeValue }[];
  groupId?: null | string;
  notes?: null | string;
  perSetWeightRanges?: { maxKg?: null | number; minKg?: null | number }[];
  repsMax?: null | number;
  repsMin?: null | number;
  restSeconds?: null | number;
  sets?: RoutineStrengthSetInput[];
  setsPlanned?: null | number;
  sortOrder: number;
  targetRir?: null | number;
  targetRpe?: null | number;
  weightRangeMaxKg?: null | number;
  weightRangeMinKg?: null | number;
  lockedFields?: string[];
};

export type RoutineCardioInput = {
  cardioMethodLibraryId?: null | string;
  displayName: string;
  fieldModes: { fieldKey: string; mode: FieldModeValue }[];
  groupId?: null | string;
  methodType: string;
  notes?: null | string;
  restSeconds: number;
  roundsPlanned: number;
  sets?: RoutineCardioSetInput[];
  sortOrder: number;
  targetDistanceMeters?: null | number;
  targetRpe?: null | number;
  workSeconds: number;
  lockedFields?: string[];
};

export type RoutinePlioInput = {
  displayName: string;
  fieldModes?: { fieldKey: string; mode: FieldModeValue }[];
  groupId?: null | string;
  notes?: null | string;
  plioExerciseLibraryId?: null | string;
  restSeconds: number;
  roundsPlanned: number;
  sets?: RoutinePlioSetInput[];
  sortOrder: number;
  targetRpe?: null | number;
  workSeconds: number;
  lockedFields?: string[];
};

export type RoutineMobilityBlockInput = {
  displayName: string;
  fieldModes?: { fieldKey: string; mode: FieldModeValue }[];
  groupId?: null | string;
  notes?: null | string;
  restSeconds: number;
  roundsPlanned: number;
  sets?: RoutineMobilitySetInput[];
  sortOrder: number;
  targetRpe?: null | number;
  mobilityExerciseLibraryId?: null | string;
  workSeconds: number;
  lockedFields?: string[];
};

export type RoutineSportInput = {
  displayName: string;
  durationMinutes: number;
  fieldModes?: { fieldKey: string; mode: FieldModeValue }[];
  groupId?: null | string;
  notes?: null | string;
  sets?: RoutineSportSetInput[];
  sortOrder: number;
  sportLibraryId?: null | string;
  targetRpe?: null | number;
  lockedFields?: string[];
};

export type RoutineIsometricInput = {
  displayName: string;
  fieldModes?: { fieldKey: string; mode: FieldModeValue }[];
  groupId?: null | string;
  isometricExerciseLibraryId?: null | string;
  notes?: null | string;
  sets?: RoutineIsometricSetInput[];
  setsPlanned?: null | number;
  sortOrder: number;
  targetRpe?: null | number;
  lockedFields?: string[];
};

export type RoutineExerciseGroupInput = {
  clientId: string;
  groupType: 'CIRCUIT' | 'SUPERSET';
  note?: null | string;
  sortOrder: number;
};

export type RoutineDayInput = {
  cardioBlocks?: RoutineCardioInput[];
  dayIndex: number;
  exercises?: RoutineStrengthInput[];
  groups?: RoutineExerciseGroupInput[];
  isometricBlocks?: RoutineIsometricInput[];
  notes?: null | string;
  notesTitle?: null | string;
  plioBlocks?: RoutinePlioInput[];
  sportBlocks?: RoutineSportInput[];
  title: string;
  mobilityBlocks?: RoutineMobilityBlockInput[];
  warmupTemplateIds?: string[];
};

export type RoutineNeatInput = {
  title: string;
  description?: string;
};

export type RoutineTemplateWriteInput = {
  days: RoutineDayInput[];
  expectedCompletionDays?: null | number;
  name: string;
  neats?: RoutineNeatInput[];
  objectiveIds?: string[];
};
