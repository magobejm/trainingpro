import { z } from 'zod';

const status = z.enum(['OPEN', 'REVIEWED', 'CLOSED']);

export class ListIncidentsQueryDto {
  static schema = z.object({
    clientId: z.string().uuid().optional(),
    status: status.optional(),
  });

  clientId?: string;
  status?: 'CLOSED' | 'OPEN' | 'REVIEWED';
}
