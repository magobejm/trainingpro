import { z } from 'zod';

export class LogIsometricSetDto {
  static schema = z.object({
    durationSecondsDone: z.number().int().min(0).max(3600).nullable().optional(),
    effortRpe: z.number().int().min(1).max(10).nullable().optional(),
    sessionIsometricBlockId: z.string().uuid(),
    setIndex: z.number().int().min(1).max(100),
    weightDoneKg: z.number().min(0).max(1000).nullable().optional(),
  });

  durationSecondsDone?: null | number;
  effortRpe?: null | number;
  sessionIsometricBlockId!: string;
  setIndex!: number;
  weightDoneKg?: null | number;
}
