import { z } from 'zod';

export class ClearFutureWorkoutsDto {
  static schema = z.object({
    clientId: z.string().uuid(),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'from must be YYYY-MM-DD'),
  });

  clientId!: string;
  from!: string;
}
