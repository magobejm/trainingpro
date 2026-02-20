import { z } from 'zod';

export class LogIntervalDto {
  static schema = z.object({
    avgHeartRate: z.number().int().min(30).max(240).nullable().optional(),
    distanceDoneMeters: z.number().int().min(0).max(500000).nullable().optional(),
    durationSecondsDone: z.number().int().min(0).max(50000).nullable().optional(),
    effortRpe: z.number().int().min(1).max(10).nullable().optional(),
    intervalIndex: z.number().int().min(1).max(1000),
    sessionCardioBlockId: z.string().uuid(),
  });

  avgHeartRate?: null | number;
  distanceDoneMeters?: null | number;
  durationSecondsDone?: null | number;
  effortRpe?: null | number;
  intervalIndex!: number;
  sessionCardioBlockId!: string;
}
