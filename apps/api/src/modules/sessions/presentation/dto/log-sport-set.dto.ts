import { z } from 'zod';
import { rirIntSchema, rpeHalfSchema } from '../../../../common/validation/effort.schema';

export class LogSportSetDto {
  static schema = z.object({
    durationSecondsDone: z.number().int().min(0).max(50000).nullable().optional(),
    effortRir: rirIntSchema,
    effortRpe: rpeHalfSchema,
    heartRateDone: z.number().int().min(30).max(250).nullable().optional(),
    hrMaxPctDone: z.number().int().min(0).max(100).nullable().optional(),
    hrReservePctDone: z.number().int().min(0).max(100).nullable().optional(),
    repsDone: z.number().int().min(0).max(200).nullable().optional(),
    restSecondsDone: z.number().int().min(0).max(3600).nullable().optional(),
    romDone: z.string().max(30).nullable().optional(),
    setIndex: z.number().int().min(1).max(100),
    weightDoneKg: z.number().min(0).max(1000).nullable().optional(),
  });

  durationSecondsDone?: null | number;
  effortRir?: null | number;
  effortRpe?: null | number;
  heartRateDone?: null | number;
  hrMaxPctDone?: null | number;
  hrReservePctDone?: null | number;
  repsDone?: null | number;
  restSecondsDone?: null | number;
  romDone?: null | string;
  setIndex!: number;
  weightDoneKg?: null | number;
}
