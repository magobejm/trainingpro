import { z } from 'zod';
import { rpeHalfSchema } from '../../../../common/validation/effort.schema';

export class LogIsometricSetDto {
  static schema = z.object({
    durationSecondsDone: z.number().int().min(0).max(3600).nullable().optional(),
    effortRpe: rpeHalfSchema,
    restSecondsDone: z.number().int().min(0).max(3600).nullable().optional(),
    sessionIsometricBlockId: z.string().uuid(),
    setIndex: z.number().int().min(1).max(100),
    weightDoneKg: z.number().min(0).max(1000).nullable().optional(),
  });

  durationSecondsDone?: null | number;
  effortRpe?: null | number;
  restSecondsDone?: null | number;
  sessionIsometricBlockId!: string;
  setIndex!: number;
  weightDoneKg?: null | number;
}
