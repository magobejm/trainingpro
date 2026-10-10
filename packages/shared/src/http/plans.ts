import { z } from 'zod';

const fieldModeSchema = z
  .object({
    fieldKey: z.string(),
    mode: z.enum(['CLIENT_INPUT', 'COACH_INPUT', 'HIDDEN']),
  })
  .strict();

const weightRangeSchema = z
  .object({
    maxKg: z.number().nullable(),
    minKg: z.number().nullable(),
  })
  .strict();

const prescriptionSchema = z
  .object({
    defaultWeightRange: weightRangeSchema,
    perSetWeightRanges: z.array(weightRangeSchema),
    repsMax: z.number().nullable(),
    repsMin: z.number().nullable(),
    restSeconds: z.number().nullable(),
    setsPlanned: z.number().nullable(),
    targetRir: z.number().nullable(),
    targetRpe: z.number().nullable(),
  })
  .strict();

const exerciseSchema = z
  .object({
    displayName: z.string(),
    exerciseLibraryId: z.string().nullable(),
    fieldModes: z.array(fieldModeSchema),
    id: z.string(),
    notes: z.string().nullable(),
    prescription: prescriptionSchema,
    sortOrder: z.number(),
  })
  .strict();

const daySchema = z
  .object({
    dayIndex: z.number(),
    exercises: z.array(exerciseSchema),
    id: z.string(),
    title: z.string(),
  })
  .strict();

export const strengthPlanTemplateSchema = z
  .object({
    coachMembershipId: z.string().nullable(),
    createdAt: z.string(),
    days: z.array(daySchema),
    id: z.string(),
    name: z.string(),
    scope: z.enum(['COACH', 'GLOBAL']),
    templateVersion: z.number(),
    updatedAt: z.string(),
  })
  .strict();

export const strengthPlanSummarySchema = z
  .object({
    createdAt: z.string(),
    days: z.array(z.never()),
    id: z.string(),
    kind: z.enum(['CARDIO', 'ROUTINE', 'STRENGTH']),
    name: z.string(),
    scope: z.enum(['COACH', 'GLOBAL']),
    templateVersion: z.number(),
    updatedAt: z.string(),
  })
  .strict();

export const strengthPlanListItemSchema = z.union([strengthPlanTemplateSchema, strengthPlanSummarySchema]);

export const strengthPlanListResponseSchema = z
  .object({
    items: z.array(strengthPlanListItemSchema),
  })
  .strict();

export type StrengthPlanDay = z.infer<typeof daySchema>;
export type StrengthPlanTemplate = z.infer<typeof strengthPlanTemplateSchema>;
export type StrengthPlanSummary = z.infer<typeof strengthPlanSummarySchema>;
export type StrengthPlanListItem = z.infer<typeof strengthPlanListItemSchema>;
export type StrengthPlanListResponse = z.infer<typeof strengthPlanListResponseSchema>;
