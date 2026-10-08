import { z } from 'zod';
import { rpeHalfSchema } from '../../../../common/validation/effort.schema';

export class LogPlioSetDto {
  static schema = z.object({
    durationSecondsDone: z.number().int().min(0).max(50000).nullable().optional(),
    effortRpe: rpeHalfSchema,
    repsDone: z.number().int().min(0).max(200).nullable().optional(),
    restSecondsDone: z.number().int().min(0).max(3600).nullable().optional(),
    sessionPlioBlockId: z.string().uuid(),
    setIndex: z.number().int().min(1).max(100),
    weightDoneKg: z.number().min(0).max(1000).nullable().optional(),
  });

  durationSecondsDone?: null | number;
  effortRpe?: null | number;
  repsDone?: null | number;
  restSecondsDone?: null | number;
  sessionPlioBlockId!: string;
  setIndex!: number;
  weightDoneKg?: null | number;
}
