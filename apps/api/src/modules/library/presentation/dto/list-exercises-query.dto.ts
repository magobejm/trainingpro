import { z } from 'zod';

export class ListExercisesQueryDto {
  static schema = z.object({
    muscleGroupId: z.string().uuid().optional(),
    query: z.string().trim().max(120).optional(),
  });

  muscleGroupId?: string;
  query?: string;
}
