import type { FieldModeValue } from './entities/field-mode.entity';

export type PlanCardioFieldModeInput = {
  fieldKey: string;
  mode: FieldModeValue;
};

export type PlanCardioBlockInput = {
  cardioMethodLibraryId?: null | string;
  displayName: string;
  fieldModes: PlanCardioFieldModeInput[];
  methodType?: null | string;
  notes?: null | string;
  restSeconds?: number;
  roundsPlanned?: number;
  sortOrder: number;
  targetDistanceMeters?: null | number;
  targetRpe?: null | number;
  workSeconds: number;
};

export type PlanCardioTemplateDayInput = {
  cardioBlocks: PlanCardioBlockInput[];
  dayIndex: number;
  title: string;
};

export type PlanCardioTemplateWriteInput = {
  days: PlanCardioTemplateDayInput[];
  name: string;
};
