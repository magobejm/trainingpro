import { z } from 'zod';

export class ListFoodsQueryDto {
  static schema = z.object({
    foodCategory: z.string().trim().max(80).optional(),
    foodType: z.string().trim().max(40).optional(),
    query: z.string().trim().max(120).optional(),
    servingUnit: z.enum(['100g', '100ml', 'porcion']).optional(),
  });

  foodCategory?: string;
  foodType?: string;
  query?: string;
  servingUnit?: string;
}
