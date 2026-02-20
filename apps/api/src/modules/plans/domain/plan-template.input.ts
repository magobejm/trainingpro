import type { FieldModeValue } from './entities/field-mode.entity';

export type PlanFieldModeInput = {
  fieldKey: string;
  mode: FieldModeValue;
};

export type PlanStrengthExerciseInput = {
  displayName: string;
  exerciseLibraryId?: null | string;
  fieldModes: PlanFieldModeInput[];
  notes?: null | string;
  perSetWeightRanges?: { maxKg?: null | number; minKg?: null | number }[];
  repsMax?: null | number;
  repsMin?: null | number;
  setsPlanned?: null | number;
  sortOrder: number;
  weightRangeMaxKg?: null | number;
  weightRangeMinKg?: null | number;
};

export type PlanTemplateDayInput = {
  dayIndex: number;
  exercises: PlanStrengthExerciseInput[];
  title: string;
};

export type PlanTemplateWriteInput = {
  days: PlanTemplateDayInput[];
  name: string;
};
