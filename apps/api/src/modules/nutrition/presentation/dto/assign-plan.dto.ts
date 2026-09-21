import { z } from 'zod';

export class AssignPlanDto {
  static schema = z.object({
    clientId: z.string().uuid(),
  });

  clientId!: string;
}
