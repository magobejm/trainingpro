import { z } from 'zod';

const nullableNumber = z.number().int().min(0).max(200000).nullable().optional();

const fieldModeSchema = z.object({
  fieldKey: z.string().trim().min(1).max(80),
  mode: z.enum(['HIDDEN', 'COACH_INPUT', 'CLIENT_INPUT']),
});

const cardioBlockSchema = z.object({
  cardioMethodLibraryId: z.string().uuid().nullable().optional(),
  displayName: z.string().trim().min(1).max(120),
  fieldModes: z.array(fieldModeSchema).min(1),
  lockedFields: z.array(z.string().max(80)).optional().default([]),
  methodType: z.string().trim().max(80).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  restSeconds: z.number().int().min(0).max(7200).optional(),
  roundsPlanned: z.number().int().min(1).max(100).optional(),
  sortOrder: z.number().int().min(0).max(200),
  targetDistanceMeters: nullableNumber,
  targetRpe: z.number().int().min(1).max(10).nullable().optional(),
  workSeconds: z.number().int().min(1).max(7200),
});

const daySchema = z.object({
  cardioBlocks: z.array(cardioBlockSchema).min(1),
  dayIndex: z.number().int().min(1).max(14),
  title: z.string().trim().min(1).max(120),
});

export class UpsertCardioTemplateDto {
  static schema = z.object({
    days: z.array(daySchema).min(1),
    name: z.string().trim().min(1).max(120),
  });

  days!: {
    cardioBlocks: {
      cardioMethodLibraryId?: null | string;
      displayName: string;
      fieldModes: { fieldKey: string; mode: 'CLIENT_INPUT' | 'COACH_INPUT' | 'HIDDEN' }[];
      lockedFields?: string[];
      methodType?: null | string;
      notes?: null | string;
      restSeconds?: number;
      roundsPlanned?: number;
      sortOrder: number;
      targetDistanceMeters?: null | number;
      targetRpe?: null | number;
      workSeconds: number;
    }[];
    dayIndex: number;
    title: string;
  }[];
  name!: string;
}
