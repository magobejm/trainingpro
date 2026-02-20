import { z } from 'zod';

export class LogSetDto {
  static schema = z.object({
    effortRpe: z.number().int().min(1).max(10).nullable().optional(),
    repsDone: z.number().int().min(0).max(200).nullable().optional(),
    sessionItemId: z.string().uuid(),
    setIndex: z.number().int().min(1).max(100),
    weightDoneKg: z.number().min(0).max(1000).nullable().optional(),
  });

  effortRpe?: null | number;
  repsDone?: null | number;
  sessionItemId!: string;
  setIndex!: number;
  weightDoneKg?: null | number;
}
