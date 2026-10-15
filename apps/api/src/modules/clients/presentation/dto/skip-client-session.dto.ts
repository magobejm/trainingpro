import { z } from 'zod';

export class SkipClientSessionDto {
  static schema = z.object({
    planDayId: z.string().uuid(),
    reason: z.string().trim().max(280).optional(),
    sessionDate: z.string().date(),
  });

  planDayId!: string;
  reason?: string;
  sessionDate!: string;
}
