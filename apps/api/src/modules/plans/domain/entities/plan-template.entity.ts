import type { FieldModeEntry } from './field-mode.entity';
import type { StrengthPrescription } from './strength-prescription.entity';

export type PlanTemplateStrengthExercise = {
  displayName: string;
  exerciseLibraryId: null | string;
  fieldModes: FieldModeEntry[];
  id: string;
  notes: null | string;
  prescription: StrengthPrescription;
  sortOrder: number;
};

export type PlanTemplateDay = {
  dayIndex: number;
  exercises: PlanTemplateStrengthExercise[];
  id: string;
  title: string;
};

export type PlanTemplate = {
  createdAt: Date;
  id: string;
  name: string;
  templateVersion: number;
  updatedAt: Date;
  days: PlanTemplateDay[];
};
