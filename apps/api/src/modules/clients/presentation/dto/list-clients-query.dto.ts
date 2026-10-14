import { z } from 'zod';
import { pageFieldsSchema } from '../../../../common/pagination/page-query';

export class ListClientsQueryDto {
  static schema = z.object({
    cursor: pageFieldsSchema.cursor,
    limit: pageFieldsSchema.limit,
    objective: z.string().trim().max(80).optional(),
    search: z.string().trim().max(120).optional(),
    sort: z.enum(['name', 'activity']).optional(),
  });

  cursor?: string;
  limit?: number;
  objective?: string;
  search?: string;
  sort?: 'activity' | 'name';
}
