import type { FieldModeEntry } from './field-mode.entity';

export type PlanTemplateCardioBlock = {
  cardioMethodLibraryId: null | string;
  displayName: string;
  fieldModes: FieldModeEntry[];
  id: string;
  notes: null | string;
  restSeconds: number;
  roundsPlanned: number;
  sortOrder: number;
  targetDistanceMeters: null | number;
  targetRpe: null | number;
  workSeconds: number;
};

export type PlanTemplateCardioDay = {
  cardioBlocks: PlanTemplateCardioBlock[];
  dayIndex: number;
  id: string;
  title: string;
};

export type PlanCardioTemplate = {
  createdAt: Date;
  days: PlanTemplateCardioDay[];
  id: string;
  name: string;
  templateVersion: number;
  updatedAt: Date;
};
