import { z } from 'zod';
import { postgresUuidString } from '../../../../common/zod/postgres-uuid.schema';

export class GetPerformedTemplatesQueryDto {
  static schema = z.object({
    clientId: postgresUuidString.optional(),
    from: z.string().date(),
    to: z.string().date(),
  });

  clientId?: string;
  from!: string;
  to!: string;
}
