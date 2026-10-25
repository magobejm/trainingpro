import { z } from 'zod';
import { aiEstimateSchema, type AiMealEstimate } from '../../application/nutrition-ai.service';

const eatenItemSchema = z.object({
  amount: z.number().positive().max(5000),
  foodId: z.string().uuid(),
});

export class UpsertMealLogDto {
  aiEstimate?: AiMealEstimate | null;
  static schema = z.object({
    aiEstimate: aiEstimateSchema.nullable().optional(),
    comment: z.string().max(500).nullable().optional(),
    date: z.string().date(),
    eatenItems: z.array(eatenItemSchema).max(20).optional(),
    mealKey: z.string().trim().min(1).max(80),
    mealName: z.string().trim().min(1).max(120),
    photoPath: z.string().max(300).nullable().optional(),
    planId: z.string().uuid(),
    status: z.enum(['DONE', 'CHANGED', 'SKIPPED']),
  });

  comment?: string | null;
  date!: string;
  eatenItems?: Array<{ amount: number; foodId: string }>;
  mealKey!: string;
  mealName!: string;
  photoPath?: string | null;
  planId!: string;
  status!: 'CHANGED' | 'DONE' | 'SKIPPED';
}

export class FoodSearchQueryDto {
  static schema = z.object({
    query: z.string().trim().max(80).optional(),
  });

  query?: string;
}

export class MealLogRangeDto {
  static schema = z.object({
    from: z.string().date(),
    to: z.string().date(),
  });

  from!: string;
  to!: string;
}

export class SubstituteQueryDto {
  static schema = z.object({
    foodId: z.string().uuid(),
    grams: z.coerce.number().positive().max(5000),
  });

  foodId!: string;
  grams!: number;
}

export class MealLogIdParamDto {
  static schema = z.object({ id: z.string().uuid() });
  id!: string;
}

export class BarcodeParamDto {
  static schema = z.object({ code: z.string().regex(/^\d{6,14}$/) });

  code!: string;
}
