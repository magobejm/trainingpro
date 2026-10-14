import { z } from 'zod';
import { pageFieldsSchema } from '../../../../common/pagination/page-query';

export class ListFoodsQueryDto {
  static schema = z.object({
    cursor: pageFieldsSchema.cursor,
    foodCategory: z.string().trim().max(80).optional(),
    foodType: z.string().trim().max(40).optional(),
    limit: pageFieldsSchema.limit,
    query: z.string().trim().max(120).optional(),
    servingUnit: z.enum(['100g', '100ml', 'porcion']).optional(),
  });

  cursor?: string;
  foodCategory?: string;
  foodType?: string;
  limit?: number;
  query?: string;
  servingUnit?: string;
}
