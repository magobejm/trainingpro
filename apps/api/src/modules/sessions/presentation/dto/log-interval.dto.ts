import { z } from 'zod';
import { rpeHalfSchema } from '../../../../common/validation/effort.schema';

export class LogIntervalDto {
  static schema = z.object({
    avgHeartRate: z.number().int().min(30).max(240).nullable().optional(),
    avgHeartRateMax: z.number().int().min(30).max(240).nullable().optional(),
    distanceDoneMeters: z.number().int().min(0).max(500000).nullable().optional(),
    durationSecondsDone: z.number().int().min(0).max(86400).nullable().optional(),
    effortRpe: rpeHalfSchema,
    hrMaxPctDone: z.number().min(0).max(100).nullable().optional(),
    hrMaxPctDoneMax: z.number().min(0).max(100).nullable().optional(),
    hrReservePctDone: z.number().min(0).max(100).nullable().optional(),
    hrReservePctDoneMax: z.number().min(0).max(100).nullable().optional(),
    intervalIndex: z.number().int().min(1).max(1000),
    restSecondsDone: z.number().int().min(0).max(86400).nullable().optional(),
    sessionCardioBlockId: z.string().uuid(),
  });

  avgHeartRate?: null | number;
  avgHeartRateMax?: null | number;
  distanceDoneMeters?: null | number;
  durationSecondsDone?: null | number;
  effortRpe?: null | number;
  hrMaxPctDone?: null | number;
  hrMaxPctDoneMax?: null | number;
  hrReservePctDone?: null | number;
  hrReservePctDoneMax?: null | number;
  intervalIndex!: number;
  restSecondsDone?: null | number;
  sessionCardioBlockId!: string;
}
