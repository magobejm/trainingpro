import { z } from 'zod';
import { rpeHalfSchema } from '../../../../common/validation/effort.schema';

const wellnessInt = z.number().int().min(1).max(10).nullable().optional();

export class FinishSessionDto {
  static schema = z.object({
    comment: z.string().max(2000).nullable().optional(),
    finishedAt: z.string().datetime({ offset: true }).optional(),
    isIncomplete: z.boolean(),
    performedDurationSeconds: z.number().int().min(0).max(604800).nullable().optional(),
    postFatigue: wellnessInt,
    postMood: wellnessInt,
    postPain: wellnessInt,
    sessionRpe: rpeHalfSchema,
  });

  comment?: null | string;
  finishedAt?: string;
  isIncomplete!: boolean;
  performedDurationSeconds?: null | number;
  postFatigue?: null | number;
  postMood?: null | number;
  postPain?: null | number;
  sessionRpe?: null | number;
}
