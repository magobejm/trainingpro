import { z } from 'zod';
import { rpeHalfSchema } from '../../../../common/validation/effort.schema';

export class LogSportDto {
  static schema = z.object({
    avgHeartRate: z.number().int().min(30).max(250).nullable().optional(),
    durationMinutesDone: z.number().int().min(0).max(600).nullable().optional(),
    effortRpe: rpeHalfSchema,
    sessionSportBlockId: z.string().uuid(),
  });

  avgHeartRate?: null | number;
  durationMinutesDone?: null | number;
  effortRpe?: null | number;
  sessionSportBlockId!: string;
}
