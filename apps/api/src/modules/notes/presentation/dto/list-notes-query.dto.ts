import { z } from 'zod';
import { pageFieldsSchema } from '../../../../common/pagination/page-query';

export class ListNotesQueryDto {
  static schema = z.object({
    cursor: pageFieldsSchema.cursor,
    limit: pageFieldsSchema.limit,
    type: z.enum(['general', 'client']).optional(),
    scope: z.enum(['general', 'client']).optional(),
    clientId: z.string().uuid().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  });

  type?: 'client' | 'general';
  scope?: 'client' | 'general';
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  limit?: number;
}
