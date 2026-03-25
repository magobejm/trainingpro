import { z } from 'zod';

const fieldModeSchema = z.object({
  fieldKey: z.string().trim().min(1).max(80),
  mode: z.enum(['HIDDEN', 'COACH_INPUT', 'CLIENT_INPUT']),
});

const nullableNumber = z.number().min(0).max(5000).nullable().optional();
const nullableInt = z.number().int().min(0).max(5000).nullable().optional();

const perSetRangeSchema = z.object({
  maxKg: nullableNumber,
  minKg: nullableNumber,
});

// Per-series schemas
const strengthSetSchema = z.object({
  setIndex: z.number().int().min(0).max(99),
  reps: z.number().int().min(0).max(999).nullable().optional(),
  rpe: z.number().int().min(1).max(10).nullable().optional(),
  weightKg: z.number().min(0).max(9999).nullable().optional(),
  rir: z.number().int().min(0).max(10).nullable().optional(),
  restSeconds: z.number().int().min(0).max(3600).nullable().optional(),
  advancedTechnique: z.string().max(40).nullable().optional(),
  note: z.string().max(1000).nullable().optional(),
});

const cardioSetSchema = z.object({
  setIndex: z.number().int().min(0).max(99),
  fcMaxPct: z.number().int().min(0).max(100).nullable().optional(),
  fcReservePct: z.number().int().min(0).max(100).nullable().optional(),
  heartRate: z.number().int().min(0).max(300).nullable().optional(),
  rpe: z.number().int().min(1).max(10).nullable().optional(),
  note: z.string().max(1000).nullable().optional(),
});

const plioSetSchema = z.object({
  setIndex: z.number().int().min(0).max(99),
  reps: z.number().int().min(0).max(999).nullable().optional(),
  rpe: z.number().int().min(1).max(10).nullable().optional(),
  weightKg: z.number().min(0).max(9999).nullable().optional(),
  restSeconds: z.number().int().min(0).max(3600).nullable().optional(),
  note: z.string().max(1000).nullable().optional(),
});

const isometricSetSchema = z.object({
  setIndex: z.number().int().min(0).max(99),
  rpe: z.number().int().min(1).max(10).nullable().optional(),
  durationSeconds: z.number().int().min(0).max(3600).nullable().optional(),
  weightKg: z.number().min(0).max(9999).nullable().optional(),
  restSeconds: z.number().int().min(0).max(3600).nullable().optional(),
  note: z.string().max(1000).nullable().optional(),
});

const warmupSetSchema = z.object({
  setIndex: z.number().int().min(0).max(99),
  reps: z.number().int().min(0).max(999).nullable().optional(),
  rpe: z.number().int().min(1).max(10).nullable().optional(),
  rom: z.string().max(30).nullable().optional(),
  restSeconds: z.number().int().min(0).max(3600).nullable().optional(),
  note: z.string().max(1000).nullable().optional(),
});

const sportSetSchema = z.object({
  setIndex: z.number().int().min(0).max(99),
  reps: z.number().int().min(0).max(999).nullable().optional(),
  rpe: z.number().int().min(1).max(10).nullable().optional(),
  rir: z.number().int().min(0).max(10).nullable().optional(),
  weightKg: z.number().min(0).max(9999).nullable().optional(),
  fcMaxPct: z.number().int().min(0).max(100).nullable().optional(),
  fcReservePct: z.number().int().min(0).max(100).nullable().optional(),
  heartRate: z.number().int().min(0).max(300).nullable().optional(),
  restSeconds: z.number().int().min(0).max(3600).nullable().optional(),
  note: z.string().max(1000).nullable().optional(),
});

// Block schemas
const strengthSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  exerciseLibraryId: z.string().uuid().nullable().optional(),
  fieldModes: z.array(fieldModeSchema).min(1),
  groupId: z.string().min(1).max(100).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  perSetWeightRanges: z.array(perSetRangeSchema).optional(),
  repsMax: z.number().int().min(1).max(100).nullable().optional(),
  repsMin: z.number().int().min(1).max(100).nullable().optional(),
  restSeconds: z.number().int().min(0).max(3600).nullable().optional(),
  sets: z.array(strengthSetSchema).max(30).optional().default([]),
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
  groupId: z.string().min(1).max(100).nullable().optional(),
  methodType: z.string().trim().min(1).max(80),
  notes: z.string().max(2000).nullable().optional(),
  restSeconds: z.number().int().min(0).max(3600),
  roundsPlanned: z.number().int().min(1).max(200),
  sets: z.array(cardioSetSchema).max(30).optional().default([]),
  sortOrder: z.number().int().min(0).max(200),
  targetDistanceMeters: z.number().int().min(0).nullable().optional(),
  targetRpe: z.number().int().min(1).max(10).nullable().optional(),
  workSeconds: z.number().int().min(1).max(36000),
});

const plioSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  fieldModes: z.array(fieldModeSchema).optional().default([]),
  groupId: z.string().min(1).max(100).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  plioExerciseLibraryId: z.string().uuid().nullable().optional(),
  restSeconds: z.number().int().min(0).max(3600),
  roundsPlanned: z.number().int().min(1).max(200),
  sets: z.array(plioSetSchema).max(30).optional().default([]),
  sortOrder: z.number().int().min(0).max(200),
  targetRpe: z.number().int().min(1).max(10).nullable().optional(),
  workSeconds: z.number().int().min(1).max(36000),
});

const warmupSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  fieldModes: z.array(fieldModeSchema).optional().default([]),
  groupId: z.string().min(1).max(100).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  restSeconds: z.number().int().min(0).max(3600),
  roundsPlanned: z.number().int().min(1).max(200),
  sets: z.array(warmupSetSchema).max(30).optional().default([]),
  sortOrder: z.number().int().min(0).max(200),
  targetRpe: z.number().int().min(1).max(10).nullable().optional(),
  warmupExerciseLibraryId: z.string().uuid().nullable().optional(),
  workSeconds: z.number().int().min(1).max(36000),
});

const sportSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  durationMinutes: z.number().int().min(1).max(600),
  fieldModes: z.array(fieldModeSchema).optional().default([]),
  groupId: z.string().min(1).max(100).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  sets: z.array(sportSetSchema).max(30).optional().default([]),
  sortOrder: z.number().int().min(0).max(200),
  sportLibraryId: z.string().uuid().nullable().optional(),
  targetRpe: z.number().int().min(1).max(10).nullable().optional(),
});

const isometricSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  fieldModes: z.array(fieldModeSchema).optional().default([]),
  groupId: z.string().min(1).max(100).nullable().optional(),
  isometricExerciseLibraryId: z.string().uuid().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  sets: z.array(isometricSetSchema).max(30).optional().default([]),
  setsPlanned: nullableInt,
  sortOrder: z.number().int().min(0).max(200),
  targetRpe: z.number().int().min(1).max(10).nullable().optional(),
});

const exerciseGroupSchema = z.object({
  clientId: z.string().min(1).max(40),
  groupType: z.enum(['CIRCUIT', 'SUPERSET']),
  note: z.string().max(1000).nullable().optional(),
  sortOrder: z.number().int().min(0).max(200),
});

const daySchema = z.object({
  cardioBlocks: z.array(cardioSchema).optional().default([]),
  dayIndex: z.number().int().min(1).max(14),
  exercises: z.array(strengthSchema).optional().default([]),
  groups: z.array(exerciseGroupSchema).optional().default([]),
  isometricBlocks: z.array(isometricSchema).optional().default([]),
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
