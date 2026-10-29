import { z } from 'zod';

export class FinishExerciseDto {
  static schema = z.object({
    itemId: z.string().uuid(),
  });

  itemId!: string;
}
