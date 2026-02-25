import type { FieldModeValue } from './entities/field-mode.entity';

export type RoutineStrengthInput = {
  displayName: string;
  exerciseLibraryId?: null | string;
  fieldModes: { fieldKey: string; mode: FieldModeValue }[];
  notes?: null | string;
  perSetWeightRanges?: { maxKg?: null | number; minKg?: null | number }[];
  repsMax?: null | number;
  repsMin?: null | number;
  restSeconds?: null | number;
  setsPlanned?: null | number;
  sortOrder: number;
  targetRir?: null | number;
  targetRpe?: null | number;
  weightRangeMaxKg?: null | number;
  weightRangeMinKg?: null | number;
};

export type RoutineCardioInput = {
  cardioMethodLibraryId?: null | string;
  displayName: string;
  fieldModes: { fieldKey: string; mode: FieldModeValue }[];
  methodType: string;
  notes?: null | string;
  restSeconds: number;
  roundsPlanned: number;
  sortOrder: number;
  targetDistanceMeters?: null | number;
  targetRpe?: null | number;
  workSeconds: number;
};

export type RoutinePlioInput = {
  displayName: string;
  notes?: null | string;
  plioExerciseLibraryId?: null | string;
  restSeconds: number;
  roundsPlanned: number;
  sortOrder: number;
  targetRpe?: null | number;
  workSeconds: number;
};

export type RoutineWarmupInput = {
  displayName: string;
  notes?: null | string;
  restSeconds: number;
  roundsPlanned: number;
  sortOrder: number;
  targetRpe?: null | number;
  warmupExerciseLibraryId?: null | string;
  workSeconds: number;
};

export type RoutineSportInput = {
  displayName: string;
  durationMinutes: number;
  notes?: null | string;
  sortOrder: number;
  sportLibraryId?: null | string;
  targetRpe?: null | number;
};

export type RoutineDayInput = {
  cardioBlocks?: RoutineCardioInput[];
  dayIndex: number;
  exercises?: RoutineStrengthInput[];
  plioBlocks?: RoutinePlioInput[];
  sportBlocks?: RoutineSportInput[];
  title: string;
  warmupBlocks?: RoutineWarmupInput[];
};

export type RoutineTemplateWriteInput = {
  days: RoutineDayInput[];
  name: string;
};
