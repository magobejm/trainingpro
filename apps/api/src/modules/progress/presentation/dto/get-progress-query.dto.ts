import { z } from 'zod';

export class GetProgressQueryDto {
  static schema = z.object({
    clientId: z.string().uuid().optional(),
    from: z.string().date(),
    to: z.string().date(),
  });

  clientId?: string;
  from!: string;
  to!: string;
}
