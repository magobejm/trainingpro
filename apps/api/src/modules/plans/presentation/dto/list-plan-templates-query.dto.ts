import { z } from 'zod';
import { pageFieldsSchema } from '../../../../common/pagination/page-query';

export class ListPlanTemplatesQueryDto {
  static schema = z.object({
    cursor: pageFieldsSchema.cursor,
    limit: pageFieldsSchema.limit,
    search: z.string().trim().max(120).optional(),
    summary: z.enum(['true', 'false']).optional(),
  });

  cursor?: string;
  limit?: number;
  search?: string;
  summary?: 'false' | 'true';
}
