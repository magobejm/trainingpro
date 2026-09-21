import { z } from 'zod';

const mealIngredientSchema = z.object({
  amountGrams: z.number().positive().max(100_000),
  foodId: z.string().uuid(),
  sortOrder: z.number().int().min(0).optional(),
});

export class CreateMealDto {
  static schema = z.object({
    category: z.string().trim().min(1).max(40),
    ingredients: z.array(mealIngredientSchema).default([]),
    name: z.string().trim().min(1).max(120),
    notes: z.string().max(2000).nullable().optional(),
  });

  category!: string;
  ingredients!: Array<{ amountGrams: number; foodId: string; sortOrder?: number }>;
  name!: string;
  notes?: null | string;
}
