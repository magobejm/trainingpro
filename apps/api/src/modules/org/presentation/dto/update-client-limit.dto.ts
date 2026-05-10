import { z } from 'zod';

export class UpdateClientLimitDto {
  static schema = z.object({
    clientLimit: z.coerce.number().int().min(0).max(100000),
  });

  clientLimit!: number;
}
