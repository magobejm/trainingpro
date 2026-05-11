import { z } from 'zod';

const wellnessInt = z.number().int().min(1).max(10).nullable().optional();

export class StartSessionDto {
  static schema = z.object({
    preFatigue: wellnessInt,
    preMotivation: wellnessInt,
    preRecovery: wellnessInt,
    startMode: z.enum(['TIMER', 'INTERACTIVE']).nullable().optional(),
  });

  preFatigue?: null | number;
  preMotivation?: null | number;
  preRecovery?: null | number;
  startMode?: null | 'INTERACTIVE' | 'TIMER';
}
