import { z } from 'zod';

const macroSchema = z.number().int().min(0).max(2000).nullable().optional();
const servingUnitSchema = z.enum(['100g', '100ml', 'porcion']);
const foodTypeSchema = z.enum(['ingrediente', 'plato']).nullable().optional();

export class CreateFoodDto {
  static schema = z.object({
    caloriesKcal: macroSchema,
    carbsG: macroSchema,
    fatG: macroSchema,
    foodCategory: z.string().trim().max(80).nullable().optional(),
    foodType: foodTypeSchema,
    mediaType: z.string().max(40).nullable().optional(),
    mediaUrl: z.string().url().max(500).nullable().optional(),
    name: z.string().trim().min(1).max(120),
    notes: z.string().max(2000).nullable().optional(),
    proteinG: macroSchema,
    servingUnit: servingUnitSchema,
  }).superRefine((value, ctx) => {
    if (value.servingUnit === 'porcion' && !value.notes?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Notes are required when servingUnit is porcion',
        path: ['notes'],
      });
    }
  });

  caloriesKcal?: null | number;
  carbsG?: null | number;
  fatG?: null | number;
  foodCategory?: null | string;
  foodType?: null | string;
  mediaType?: null | string;
  mediaUrl?: null | string;
  name!: string;
  notes?: null | string;
  proteinG?: null | number;
  servingUnit!: string;
}
