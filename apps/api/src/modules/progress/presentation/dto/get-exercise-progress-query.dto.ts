import { z } from 'zod';
import { postgresUuidString } from '../../../../common/zod/postgres-uuid.schema';

export class GetExerciseProgressQueryDto {
  static schema = z.object({
    clientId: postgresUuidString.optional(),
    exerciseId: postgresUuidString,
    from: z.string().date(),
    to: z.string().date(),
  });

  clientId?: string;
  exerciseId!: string;
  from!: string;
  to!: string;
}
