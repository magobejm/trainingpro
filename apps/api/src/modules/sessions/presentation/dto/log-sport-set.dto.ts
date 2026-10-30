import { z } from 'zod';
import { rirIntSchema, rpeHalfSchema } from '../../../../common/validation/effort.schema';

export class LogSportSetDto {
  static schema = z.object({
    distanceDoneMeters: z.number().int().min(0).max(500000).nullable().optional(),
    durationSecondsDone: z.number().int().min(0).max(86400).nullable().optional(),
    effortRir: rirIntSchema,
    effortRpe: rpeHalfSchema,
    heartRateDone: z.number().int().min(30).max(250).nullable().optional(),
    heartRateDoneMax: z.number().int().min(30).max(250).nullable().optional(),
    hrMaxPctDone: z.number().int().min(0).max(100).nullable().optional(),
    hrMaxPctDoneMax: z.number().int().min(0).max(100).nullable().optional(),
    hrReservePctDone: z.number().int().min(0).max(100).nullable().optional(),
    hrReservePctDoneMax: z.number().int().min(0).max(100).nullable().optional(),
    repsDone: z.number().int().min(0).max(200).nullable().optional(),
    restSecondsDone: z.number().int().min(0).max(86400).nullable().optional(),
    romDone: z.string().max(30).nullable().optional(),
    setIndex: z.number().int().min(1).max(100),
    weightDoneKg: z.number().min(0).max(1000).nullable().optional(),
  });

  distanceDoneMeters?: null | number;
  durationSecondsDone?: null | number;
  effortRir?: null | number;
  effortRpe?: null | number;
  heartRateDone?: null | number;
  heartRateDoneMax?: null | number;
  hrMaxPctDone?: null | number;
  hrMaxPctDoneMax?: null | number;
  hrReservePctDone?: null | number;
  hrReservePctDoneMax?: null | number;
  repsDone?: null | number;
  restSecondsDone?: null | number;
  romDone?: null | string;
  setIndex!: number;
  weightDoneKg?: null | number;
}
