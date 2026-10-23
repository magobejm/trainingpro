import { z } from 'zod';

export class UpsertMealLogDto {
  static schema = z.object({
    comment: z.string().max(500).nullable().optional(),
    date: z.string().date(),
    mealKey: z.string().trim().min(1).max(80),
    mealName: z.string().trim().min(1).max(120),
    photoPath: z.string().max(300).nullable().optional(),
    planId: z.string().uuid(),
    status: z.enum(['DONE', 'CHANGED', 'SKIPPED']),
  });

  comment?: string | null;
  date!: string;
  mealKey!: string;
  mealName!: string;
  photoPath?: string | null;
  planId!: string;
  status!: 'CHANGED' | 'DONE' | 'SKIPPED';
}

export class MealLogRangeDto {
  static schema = z.object({
    from: z.string().date(),
    to: z.string().date(),
  });

  from!: string;
  to!: string;
}

export class MealLogIdParamDto {
  static schema = z.object({ id: z.string().uuid() });
  id!: string;
}
