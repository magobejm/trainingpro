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
    updatedAt: z.string(),
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
    notes: z.string().nullable(),
    objective: z.string(),
    objectiveId: z.string(),
    objectiveOptions: z.array(clientObjectiveSchema).optional(),
    organizationId: z.string(),
    phone: z.string().nullable(),
    progressPhotos: z.array(clientProgressPhotoSchema),
    secondaryObjectives: z.array(z.string()),
    sex: z.string().nullable(),
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
    items: z.array(clientViewSchema),
  })
  .strict();

export type ClientObjective = z.infer<typeof clientObjectiveSchema>;
export type ClientProgressPhoto = z.infer<typeof clientProgressPhotoSchema>;
export type ClientView = z.infer<typeof clientViewSchema>;
export type ClientListResponse = z.infer<typeof clientListResponseSchema>;
