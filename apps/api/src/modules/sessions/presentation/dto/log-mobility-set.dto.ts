import { z } from 'zod';
import { rpeHalfSchema } from '../../../../common/validation/effort.schema';

export class LogMobilitySetDto {
  static schema = z.object({
    effortRpe: rpeHalfSchema,
    repsDone: z.number().int().min(0).max(200).nullable().optional(),
    restSecondsDone: z.number().int().min(0).max(3600).nullable().optional(),
    romDone: z.string().max(30).nullable().optional(),
    sessionMobilityBlockId: z.string().uuid(),
    setIndex: z.number().int().min(1).max(100),
    weightDoneKg: z.number().min(0).max(1000).nullable().optional(),
  });

  effortRpe?: null | number;
  repsDone?: null | number;
  restSecondsDone?: null | number;
  romDone?: null | string;
  sessionMobilityBlockId!: string;
  setIndex!: number;
  weightDoneKg?: null | number;
}
