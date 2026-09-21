import { CreateMealDto } from './create-meal.dto';

export class UpdateMealDto {
  static schema = CreateMealDto.schema.partial();

  category?: string;
  ingredients?: Array<{ amountGrams: number; foodId: string; sortOrder?: number }>;
  name?: string;
  notes?: null | string;
}
