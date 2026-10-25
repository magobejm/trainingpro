import { z } from 'zod';

export const clientObjectiveSchema = z
  .object({
    code: z.string(),
    id: z.string(),
    isDefault: z.boolean(),
    label: z.string(),
    sortOrder: z.number(),
  })
  .strict();

export const clientProgressPhotoSchema = z
  .object({
    archived: z.boolean(),
    clientId: z.string(),
    createdAt: z.string(),
    id: z.string(),
    imagePath: z.string(),
    imageUrl: z.string(),
    pose: z.enum(['front', 'side', 'back']).nullable(),
    updatedAt: z.string(),
    uploadedBy: z.enum(['coach', 'client']),
  })
  .strict();

export const clientStatusReasonSchema = z
  .object({
    adherencePercent: z.number().optional(),
    code: z.enum(['adherence_low', 'inactive', 'incident_open', 'incident_severe', 'mood_low']),
    days: z.number().optional(),
    mood: z.number().optional(),
  })
  .strict();

export const clientStatusSchema = z
  .object({
    level: z.enum(['amber', 'green', 'none', 'red']),
    reasons: z.array(clientStatusReasonSchema),
  })
  .strict();

export const clientViewSchema = z
  .object({
    allergies: z.string().nullable(),
    avatarUrl: z.string(),
    birthDate: z.string().nullable(),
    coachMembershipId: z.string(),
    considerations: z.string().nullable(),
    createdAt: z.string(),
    email: z.string(),
    fcMax: z.number().nullable(),
    fcRest: z.number().nullable(),
    firstName: z.string(),
    fitnessLevel: z.string().nullable(),
    heightCm: z.number().nullable(),
    hipCm: z.number().nullable(),
    id: z.string(),
    injuries: z.string().nullable(),
    lastName: z.string(),
    lastActivityAt: z.string().nullable().optional(),
    notes: z.string().nullable(),
    objective: z.string(),
    objectiveId: z.string(),
    objectiveOptions: z.array(clientObjectiveSchema).optional(),
    organizationId: z.string(),
    phone: z.string().nullable(),
    progressPhotos: z.array(clientProgressPhotoSchema),
    secondaryObjectives: z.array(z.string()),
    sex: z.string().nullable(),
    status: clientStatusSchema.optional(),
    trainingPlan: z
      .object({
        id: z.string(),
        name: z.string(),
      })
      .strict()
      .optional(),
    trainingPlanId: z.string().nullable(),
    updatedAt: z.string(),
    waistCm: z.number().nullable(),
    weightKg: z.number().nullable(),
  })
  .strict();

export const clientListResponseSchema = z
  .object({
    nextCursor: z.string().nullable().optional(),
    items: z.array(clientViewSchema),
  })
  .strict();

export type ClientStatus = z.infer<typeof clientStatusSchema>;
export type ClientObjective = z.infer<typeof clientObjectiveSchema>;
export const clientMeasurementSchema = z
  .object({
    bodyFatPct: z.number().nullable().optional(),
    clientId: z.string(),
    createdAt: z.string(),
    fcMax: z.number().nullable().optional(),
    fcRest: z.number().nullable().optional(),
    heightCm: z.number().nullable(),
    hipCm: z.number().nullable(),
    id: z.string(),
    measuredAt: z.string().optional(),
    notes: z.string().nullable().optional(),
    recordedBy: z.enum(['coach', 'client']),
    waistCm: z.number().nullable(),
    weightKg: z.number().nullable(),
  })
  .strict();

export const clientMeasurementListSchema = z
  .object({
    items: z.array(clientMeasurementSchema),
  })
  .strict();

export type ClientMeasurement = z.infer<typeof clientMeasurementSchema>;
export type ClientMeasurementList = z.infer<typeof clientMeasurementListSchema>;
export type ClientProgressPhoto = z.infer<typeof clientProgressPhotoSchema>;
export type ClientView = z.infer<typeof clientViewSchema>;
export type ClientListResponse = z.infer<typeof clientListResponseSchema>;
