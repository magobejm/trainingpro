import { z } from 'zod';

export class MealIdParamDto {
  static schema = z.object({
    mealId: z.string().uuid(),
  });

  mealId!: string;
}
