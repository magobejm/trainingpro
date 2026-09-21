import { z } from 'zod';

export class PlanIdParamDto {
  static schema = z.object({
    planId: z.string().uuid(),
  });

  planId!: string;
}
