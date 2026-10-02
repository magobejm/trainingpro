import { z } from 'zod';

const wellnessInt = z.number().int().min(1).max(10).nullable().optional();
const sessionRpe = z
  .number()
  .min(1)
  .max(10)
  .refine((value) => Math.abs(value * 2 - Math.round(value * 2)) < 1e-8, {
    message: 'RPE must use 0.5 increments',
  })
  .nullable()
  .optional();

export class FinishSessionDto {
  static schema = z.object({
    comment: z.string().max(2000).nullable().optional(),
    isIncomplete: z.boolean(),
    postFatigue: wellnessInt,
    postMood: wellnessInt,
    postPain: wellnessInt,
    sessionRpe,
  });

  comment?: null | string;
  isIncomplete!: boolean;
  postFatigue?: null | number;
  postMood?: null | number;
  postPain?: null | number;
  sessionRpe?: null | number;
}
