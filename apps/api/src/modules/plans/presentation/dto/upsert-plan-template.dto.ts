import { z } from 'zod';

const nullableNumber = z.number().min(0).max(5000).nullable().optional();

const perSetRangeSchema = z.object({
  maxKg: nullableNumber,
  minKg: nullableNumber,
});

const fieldModeSchema = z.object({
  fieldKey: z.string().trim().min(1).max(80),
  mode: z.enum(['HIDDEN', 'COACH_INPUT', 'CLIENT_INPUT']),
});

const exerciseSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  exerciseLibraryId: z.string().uuid().nullable().optional(),
  fieldModes: z.array(fieldModeSchema).min(1),
  notes: z.string().max(2000).nullable().optional(),
  perSetWeightRanges: z.array(perSetRangeSchema).optional(),
  repsMax: z.number().int().min(1).max(100).nullable().optional(),
  repsMin: z.number().int().min(1).max(100).nullable().optional(),
  restSeconds: z.number().int().min(0).max(3600).nullable().optional(),
  setsPlanned: z.number().int().min(1).max(30).nullable().optional(),
  sortOrder: z.number().int().min(0).max(200),
  targetRir: z.number().int().min(0).max(10).nullable().optional(),
  targetRpe: z.number().int().min(1).max(10).nullable().optional(),
  weightRangeMaxKg: nullableNumber,
  weightRangeMinKg: nullableNumber,
});

const daySchema = z.object({
  dayIndex: z.number().int().min(1).max(14),
  exercises: z.array(exerciseSchema).min(1),
  title: z.string().trim().min(1).max(120),
});

export class UpsertPlanTemplateDto {
  static schema = z.object({
    days: z.array(daySchema).min(1),
    name: z.string().trim().min(1).max(120),
  });

  days!: {
    dayIndex: number;
    exercises: {
      displayName: string;
      exerciseLibraryId?: null | string;
      fieldModes: { fieldKey: string; mode: 'CLIENT_INPUT' | 'COACH_INPUT' | 'HIDDEN' }[];
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
    }[];
    title: string;
  }[];
  name!: string;
}
