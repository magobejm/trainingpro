import { z } from 'zod';

const status = z.enum(['OPEN', 'REVIEWED', 'CLOSED']);

export class ListIncidentsQueryDto {
  static schema = z.object({
    category: z.enum(['EXERCISE', 'OTHER']).optional(),
    clientId: z.string().uuid().optional(),
    status: status.optional(),
  });

  category?: 'EXERCISE' | 'OTHER';
  clientId?: string;
  status?: 'CLOSED' | 'OPEN' | 'REVIEWED';
}
