import { z } from 'zod';
import { postgresUuidString } from '../../../../common/zod/postgres-uuid.schema';

export class GetMicrocycleProgressQueryDto {
  static schema = z.object({
    clientId: postgresUuidString.optional(),
    templateId: postgresUuidString,
    from: z.string().date(),
    to: z.string().date(),
  });

  clientId?: string;
  templateId!: string;
  from!: string;
  to!: string;
}
