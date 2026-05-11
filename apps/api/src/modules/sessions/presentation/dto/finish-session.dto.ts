import { z } from 'zod';

const wellnessInt = z.number().int().min(1).max(10).nullable().optional();

export class FinishSessionDto {
  static schema = z.object({
    comment: z.string().max(2000).nullable().optional(),
    isIncomplete: z.boolean(),
    postFatigue: wellnessInt,
    postMood: wellnessInt,
    postPain: wellnessInt,
  });

  comment?: null | string;
  isIncomplete!: boolean;
  postFatigue?: null | number;
  postMood?: null | number;
  postPain?: null | number;
}
