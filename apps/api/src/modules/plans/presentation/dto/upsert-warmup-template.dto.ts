import { z } from 'zod';

const blockTypeSchema = z.enum(['strength', 'cardio', 'plio', 'mobility', 'isometric', 'sport']);

const itemSchema = z.object({
  blockType: blockTypeSchema,
  cardioMethodLibraryId: z.string().uuid().nullable().optional(),
  displayName: z.string().trim().min(1).max(120),
  durationMinutes: z.number().int().min(0).max(600).nullable().optional(),
  exerciseLibraryId: z.string().uuid().nullable().optional(),
  groupId: z.string().nullable().optional(),
  isometricExerciseLibraryId: z.string().uuid().nullable().optional(),
  lockedFields: z.array(z.string().max(80)).optional().default([]),
  metadataJson: z.record(z.string(), z.unknown()).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  plioExerciseLibraryId: z.string().uuid().nullable().optional(),
  repsMax: z.number().int().min(1).max(200).nullable().optional(),
  repsMin: z.number().int().min(1).max(200).nullable().optional(),
  restSeconds: z.number().int().min(0).max(7200).nullable().optional(),
  roundsPlanned: z.number().int().min(1).max(200).nullable().optional(),
  setsPlanned: z.number().int().min(1).max(50).nullable().optional(),
  sortOrder: z.number().int().min(0).max(300),
  sportLibraryId: z.string().uuid().nullable().optional(),
  targetRir: z.number().int().min(0).max(10).nullable().optional(),
  targetRpe: z.number().int().min(1).max(10).nullable().optional(),
  warmupExerciseLibraryId: z.string().uuid().nullable().optional(),
  workSeconds: z.number().int().min(0).max(36000).nullable().optional(),
});

const groupSchema = z.object({
  groupType: z.enum(['CIRCUIT']),
  id: z.string().min(1),
  note: z.string().max(500).nullable().optional(),
  sortOrder: z.number().int().min(0).max(300),
});

export class UpsertWarmupTemplateDto {
  static schema = z.object({
    groups: z.array(groupSchema).optional().default([]),
    items: z.array(itemSchema).min(1),
    name: z.string().trim().min(1).max(120),
  });

  groups!: z.infer<typeof UpsertWarmupTemplateDto.schema>['groups'];
  items!: z.infer<typeof UpsertWarmupTemplateDto.schema>['items'];
  name!: string;
}
