import { z } from 'zod';

export const PAR_Q_KEYS = [
  'heart',
  'chestPain',
  'dizziness',
  'bone',
  'bloodPressure',
  'otherReason',
  'supervision',
] as const;

export const clientIntakeAnswersSchema = z.object({
  allergies: z.string().max(2000).optional().default(''),
  availableDays: z
    .array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']))
    .max(7)
    .optional()
    .default([]),
  equipment: z.array(z.string().trim().min(1).max(40)).max(20).optional().default([]),
  heightCm: z.number().int().min(80).max(260).nullable().optional(),
  hipCm: z.number().int().min(40).max(220).nullable().optional(),
  injuries: z.string().max(2000).optional().default(''),
  objectiveNote: z.string().max(500).optional().default(''),
  parq: z.record(z.string(), z.boolean()).optional().default({}),
  waistCm: z.number().int().min(40).max(220).nullable().optional(),
  weightKg: z.number().min(20).max(400).nullable().optional(),
});

export type ClientIntakeAnswers = z.infer<typeof clientIntakeAnswersSchema>;

export function parqNeedsCoachReview(answers: ClientIntakeAnswers): boolean {
  return Object.values(answers.parq).some(Boolean);
}
