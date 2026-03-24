import { z } from 'zod';

const fieldModeSchema = z.object({
  fieldKey: z.string().trim().min(1).max(80),
  mode: z.enum(['HIDDEN', 'COACH_INPUT', 'CLIENT_INPUT']),
});

const nullableNumber = z.number().min(0).max(5000).nullable().optional();

const perSetRangeSchema = z.object({
  maxKg: nullableNumber,
  minKg: nullableNumber,
});

const strengthSchema = z.object({
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

const cardioSchema = z.object({
  cardioMethodLibraryId: z.string().uuid().nullable().optional(),
  displayName: z.string().trim().min(1).max(120),
  fieldModes: z.array(fieldModeSchema).min(1),
  methodType: z.string().trim().min(1).max(80),
  notes: z.string().max(2000).nullable().optional(),
  restSeconds: z.number().int().min(0).max(3600),
  roundsPlanned: z.number().int().min(1).max(200),
  sortOrder: z.number().int().min(0).max(200),
  targetDistanceMeters: z.number().int().min(0).nullable().optional(),
  targetRpe: z.number().int().min(1).max(10).nullable().optional(),
  workSeconds: z.number().int().min(1).max(36000),
});

const plioSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  notes: z.string().max(2000).nullable().optional(),
  plioExerciseLibraryId: z.string().uuid().nullable().optional(),
  restSeconds: z.number().int().min(0).max(3600),
  roundsPlanned: z.number().int().min(1).max(200),
  sortOrder: z.number().int().min(0).max(200),
  targetRpe: z.number().int().min(1).max(10).nullable().optional(),
  workSeconds: z.number().int().min(1).max(36000),
});

const warmupSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  notes: z.string().max(2000).nullable().optional(),
  restSeconds: z.number().int().min(0).max(3600),
  roundsPlanned: z.number().int().min(1).max(200),
  sortOrder: z.number().int().min(0).max(200),
  targetRpe: z.number().int().min(1).max(10).nullable().optional(),
  warmupExerciseLibraryId: z.string().uuid().nullable().optional(),
  workSeconds: z.number().int().min(1).max(36000),
});

const sportSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  durationMinutes: z.number().int().min(1).max(600),
  notes: z.string().max(2000).nullable().optional(),
  sortOrder: z.number().int().min(0).max(200),
  sportLibraryId: z.string().uuid().nullable().optional(),
  targetRpe: z.number().int().min(1).max(10).nullable().optional(),
});

const daySchema = z.object({
  cardioBlocks: z.array(cardioSchema).optional().default([]),
  dayIndex: z.number().int().min(1).max(14),
  exercises: z.array(strengthSchema).optional().default([]),
  plioBlocks: z.array(plioSchema).optional().default([]),
  sportBlocks: z.array(sportSchema).optional().default([]),
  title: z.string().trim().min(1).max(120),
  warmupBlocks: z.array(warmupSchema).optional().default([]),
});

const neatSchema = z.object({
  description: z.string().max(1000).optional().default(''),
  title: z.string().trim().min(1).max(200),
});

export class UpsertRoutineTemplateDto {
  static schema = z.object({
    days: z.array(daySchema).min(1),
    expectedCompletionDays: z.number().int().min(1).max(365).nullable().optional(),
    name: z.string().trim().min(1).max(120),
    neats: z.array(neatSchema).max(20).optional().default([]),
    objectiveIds: z.array(z.string().uuid()).max(3).optional().default([]),
  });

  days!: z.infer<typeof UpsertRoutineTemplateDto.schema>['days'];
  expectedCompletionDays?: null | number;
  name!: string;
  neats?: { description?: string; title: string }[];
  objectiveIds?: string[];
}
