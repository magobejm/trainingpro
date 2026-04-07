import { z } from 'zod';

export class ListNotesQueryDto {
  static schema = z.object({
    type: z.enum(['general', 'client']).optional(),
    clientId: z.string().uuid().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  });

  type?: 'client' | 'general';
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
}
