import { z } from 'zod';

export class LogSportDto {
  static schema = z.object({
    avgHeartRate: z.number().int().min(30).max(250).nullable().optional(),
    durationMinutesDone: z.number().int().min(0).max(600).nullable().optional(),
    effortRpe: z.number().int().min(1).max(10).nullable().optional(),
    sessionSportBlockId: z.string().uuid(),
  });

  avgHeartRate?: null | number;
  durationMinutesDone?: null | number;
  effortRpe?: null | number;
  sessionSportBlockId!: string;
}
