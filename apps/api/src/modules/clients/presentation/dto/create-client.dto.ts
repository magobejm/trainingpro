import { z } from 'zod';

export class CreateClientDto {
  static schema = z.object({
    allergies: z.string().max(2000).nullable().optional(),
    avatarUrl: z.string().url().max(500).nullable().optional(),
    birthDate: z.string().date().optional(),
    considerations: z.string().max(2000).nullable().optional(),
    email: z.string().email(),
    fcMax: z.number().int().min(80).max(250).nullable().optional(),
    fcRest: z.number().int().min(30).max(160).nullable().optional(),
    firstName: z.string().trim().min(1).max(80),
    fitnessLevel: z.string().max(30).nullable().optional(),
    heightCm: z.number().int().min(80).max(260).nullable().optional(),
    hipCm: z.number().int().min(40).max(220).nullable().optional(),
    injuries: z.string().max(2000).nullable().optional(),
    lastName: z.string().trim().min(1).max(80),
    notes: z.string().max(2000).nullable().optional(),
    objectiveId: z.string().uuid().nullable().optional(),
    phone: z.string().max(30).nullable().optional(),
    secondaryObjectives: z.array(z.string().trim().min(1).max(80)).max(12).optional(),
    sex: z.string().max(30).nullable().optional(),
    waistCm: z.number().int().min(40).max(220).nullable().optional(),
    weightKg: z.number().min(20).max(400).nullable().optional(),
  });

  allergies?: null | string;
  avatarUrl?: null | string;
  birthDate?: string;
  considerations?: null | string;
  email!: string;
  fcMax?: number | null;
  fcRest?: number | null;
  firstName!: string;
  fitnessLevel?: null | string;
  heightCm?: number | null;
  hipCm?: number | null;
  injuries?: null | string;
  lastName!: string;
  notes?: null | string;
  objectiveId?: null | string;
  phone?: null | string;
  secondaryObjectives?: string[];
  sex?: null | string;
  waistCm?: number | null;
  weightKg?: number | null;
}
