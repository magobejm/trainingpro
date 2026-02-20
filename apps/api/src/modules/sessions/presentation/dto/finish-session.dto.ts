import { z } from 'zod';

export class FinishSessionDto {
  static schema = z.object({
    comment: z.string().max(2000).nullable().optional(),
    isIncomplete: z.boolean(),
  });

  comment?: null | string;
  isIncomplete!: boolean;
}
