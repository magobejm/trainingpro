import { z } from 'zod';

export class EnsureClientSelfSessionDto {
  static schema = z.object({
    confirmDayChange: z.boolean().optional(),
    planDayId: z.string().uuid().optional(),
    sessionDate: z.string().date(),
  });

  confirmDayChange?: boolean;
  planDayId?: string;
  sessionDate!: string;
}
