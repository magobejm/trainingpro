import { z } from 'zod';
import { PROGRESS_MAX_DAYS, spanWithin } from '../../../../common/dates/date-span';
import { postgresUuidString } from '../../../../common/zod/postgres-uuid.schema';

const exerciseTypeSchema = z.enum(['strength', 'cardio', 'plio', 'mobility', 'isometric', 'sport']);

export class GetExerciseProgressQueryDto {
  static schema = z
    .object({
      clientId: postgresUuidString.optional(),
      exerciseId: postgresUuidString,
      exerciseType: exerciseTypeSchema.optional().default('strength'),
      from: z.string().date(),
      to: z.string().date(),
    })
    .superRefine(spanWithin(PROGRESS_MAX_DAYS));

  clientId?: string;
  exerciseId!: string;
  exerciseType?: string;
  from!: string;
  to!: string;
}
