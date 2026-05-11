import { z } from 'zod';

export class EnsureClientSelfSessionDto {
  static schema = z.object({
    sessionDate: z.string().date(),
    planDayId: z.string().uuid().optional(),
  });

  planDayId?: string;
  sessionDate!: string;
}
