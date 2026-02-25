import { z } from 'zod';

export class UpdateClientDto {
  static schema = z.object({
    avatarUrl: z.string().url().max(500).nullable().optional(),
    birthDate: z.string().date().nullable().optional(),
    email: z.string().email().optional(),
    firstName: z.string().trim().min(1).max(80).optional(),
    heightCm: z.number().int().min(80).max(260).nullable().optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
    notes: z.string().max(2000).nullable().optional(),
    objectiveId: z.string().uuid().nullable().optional(),
    trainingPlanId: z.string().uuid().nullable().optional(),
    phone: z.string().max(30).nullable().optional(),
    sex: z.string().max(30).nullable().optional(),
    weightKg: z.number().min(20).max(400).nullable().optional(),
  });

  avatarUrl?: null | string;
  birthDate?: null | string;
  email?: string;
  firstName?: string;
  heightCm?: number | null;
  lastName?: string;
  notes?: null | string;
  objectiveId?: null | string;
  trainingPlanId?: string | null;
  phone?: null | string;
  sex?: null | string;
  weightKg?: number | null;
}
