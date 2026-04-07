import { z } from 'zod';

function coerceTrainingPlanId(val: unknown): unknown {
  if (val === null || val === undefined) return val;
  if (typeof val !== 'string') return val;
  const s = val.trim();
  if (s === '') return undefined;
  const lower = s.toLowerCase();
  if (/^[0-9a-f]{32}$/.test(lower)) {
    return `${lower.slice(0, 8)}-${lower.slice(8, 12)}-${lower.slice(12, 16)}-${lower.slice(16, 20)}-${lower.slice(20)}`;
  }
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(lower)) {
    return lower;
  }
  return val;
}

export class UpdateClientDto {
  static schema = z.object({
    allergies: z.string().max(2000).nullable().optional(),
    avatarUrl: z.string().url().max(500).nullable().optional(),
    birthDate: z.string().date().nullable().optional(),
    considerations: z.string().max(2000).nullable().optional(),
    email: z.string().email().optional(),
    fcMax: z.number().int().min(80).max(250).nullable().optional(),
    fcRest: z.number().int().min(30).max(160).nullable().optional(),
    firstName: z.string().trim().min(1).max(80).optional(),
    fitnessLevel: z.string().max(30).nullable().optional(),
    heightCm: z.number().int().min(80).max(260).nullable().optional(),
    hipCm: z.number().int().min(40).max(220).nullable().optional(),
    injuries: z.string().max(2000).nullable().optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
    notes: z.string().max(2000).nullable().optional(),
    objectiveId: z.string().uuid().nullable().optional(),
    trainingPlanId: z.preprocess(
      coerceTrainingPlanId,
      z
        .string()
        .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid UUID')
        .nullable()
        .optional(),
    ),
    phone: z.string().max(30).nullable().optional(),
    secondaryObjectives: z.array(z.string().trim().min(1).max(80)).max(12).optional(),
    sex: z.string().max(30).nullable().optional(),
    waistCm: z.number().int().min(40).max(220).nullable().optional(),
    weightKg: z.number().min(20).max(400).nullable().optional(),
  });

  allergies?: null | string;
  avatarUrl?: null | string;
  birthDate?: null | string;
  considerations?: null | string;
  email?: string;
  fcMax?: number | null;
  fcRest?: number | null;
  firstName?: string;
  fitnessLevel?: null | string;
  heightCm?: number | null;
  hipCm?: number | null;
  injuries?: null | string;
  lastName?: string;
  notes?: null | string;
  objectiveId?: null | string;
  trainingPlanId?: string | null;
  phone?: null | string;
  secondaryObjectives?: string[];
  sex?: null | string;
  waistCm?: number | null;
  weightKg?: number | null;
}
