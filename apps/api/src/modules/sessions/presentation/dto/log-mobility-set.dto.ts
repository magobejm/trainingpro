import { z } from 'zod';

export class LogMobilitySetDto {
  static schema = z.object({
    effortRpe: z.number().int().min(1).max(10).nullable().optional(),
    repsDone: z.number().int().min(0).max(200).nullable().optional(),
    romDone: z.string().max(30).nullable().optional(),
    sessionMobilityBlockId: z.string().uuid(),
    setIndex: z.number().int().min(1).max(100),
  });

  effortRpe?: null | number;
  repsDone?: null | number;
  romDone?: null | string;
  sessionMobilityBlockId!: string;
  setIndex!: number;
}
