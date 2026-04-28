import { z } from 'zod';
import { postgresUuidString } from '../../../../common/zod/postgres-uuid.schema';

export class GetExercisePrQueryDto {
  static schema = z.object({
    clientId: postgresUuidString.optional(),
    exerciseId: postgresUuidString,
  });

  clientId?: string;
  exerciseId!: string;
}
