import { z } from 'zod';

export class RecordPhysicalTestResultDto {
  static schema = z.object({
    gender: z.enum(['M', 'F']),
    age: z.number().int().min(5).max(120),
    weight: z.number().positive().optional(),
    timeMin: z.number().min(0).optional(),
    timeSec: z.number().min(0).optional(),
    hr: z.number().min(0).optional(),
    distance: z.number().optional(),
    reps: z.number().int().min(0).optional(),
    palier: z.number().min(0).optional(),
    workload: z.number().min(0).optional(),
    eyesClosed: z.boolean().optional(),
    level: z.enum(['Recreacional', 'Avanzado']).optional(),
  });

  gender!: 'F' | 'M';
  age!: number;
  weight?: number;
  timeMin?: number;
  timeSec?: number;
  hr?: number;
  distance?: number;
  reps?: number;
  palier?: number;
  workload?: number;
  eyesClosed?: boolean;
  level?: 'Avanzado' | 'Recreacional';
}
