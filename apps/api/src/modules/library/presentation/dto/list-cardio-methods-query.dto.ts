import { z } from 'zod';

export class ListCardioMethodsQueryDto {
  static schema = z.object({
    methodTypeId: z.string().uuid().optional(),
    query: z.string().trim().max(120).optional(),
  });

  methodTypeId?: string;
  query?: string;
}
